import 'jest-extended';
import { FieldType, DataTypeConfig, DataTypeFields } from '@terascope/types';
import { TealFrame, closeDuckDatabase, diffSchema, DataFrame } from '../../src/index.js';
import { SAMPLES, ALREADY_LIST, CHILDREN } from './helpers/field-samples.js';

const ALL_TYPES = Object.keys(SAMPLES) as FieldType[];

async function roundTrip(
    type: FieldType, array: boolean
): Promise<{ value: unknown; expected: unknown; mismatches: unknown[] }> {
    const children = CHILDREN[type] ?? {};
    const childFields = Object.fromEntries(
        Object.entries(children).map(([name, cfg]) => [`field.${name}`, cfg])
    );

    const config: DataTypeConfig = {
        version: 1,
        fields: { field: { type, array }, ...childFields } as DataTypeFields,
    };

    const sample = SAMPLES[type];
    const record = { field: array ? [sample] : sample };

    const frame = await TealFrame.fromRecords(config, [record], { name: `sweep_${type}` });
    try {
        const rows: Record<string, unknown>[] = [];
        for await (const row of frame.rows()) rows.push(row);
        const [expected] = DataFrame.fromJSON(config, [record]).toJSON();
        return {
            value: rows[0]?.field,
            expected: (expected as Record<string, unknown>).field,
            mismatches: await diffSchema(frame),
        };
    } finally {
        await frame.destroy();
    }
}

/** Recursively assert nothing in the value is a DuckDB wrapper object. */
function assertPlain(value: unknown, path = 'value'): void {
    if (value == null) return;

    if (Array.isArray(value)) {
        value.forEach((item, i) => assertPlain(item, `${path}[${i}]`));
        return;
    }

    if (typeof value === 'object') {
        const name = value.constructor?.name ?? 'Object';
        // a DuckDB wrapper is any non-plain class instance, e.g. DuckDBListValue
        expect(name).toEqual('Object');
        Object.entries(value as Record<string, unknown>)
            .forEach(([key, val]) => assertPlain(val, `${path}.${key}`));
    }
}

describe('every FieldType round-trips through the frame', () => {
    afterAll(async () => {
        await closeDuckDatabase();
    });

    describe.each(ALL_TYPES)('%s', (type) => {
        it('survives fromRecords -> rows() and yields a non-null plain value', async () => {
            const { value } = await roundTrip(type, false);
            expect(value).not.toBeNull();
            assertPlain(value);
        });

        /**
         * Plain values are not enough. An `Any` or untyped `Object` returned as JSON text would
         * pass the check above as a plain string while callers got `'{"x":1}'` for `{x: 1}`.
        */
        it('yields exactly what DataFrame yields', async () => {
            const { value, expected } = await roundTrip(type, false);
            expect(value).toEqual(expected);
        });

        it('has a table schema matching its declared config', async () => {
            const { mismatches } = await roundTrip(type, false);
            expect(mismatches).toEqual([]);
        });
    });

    describe.each(ALL_TYPES.filter((t) => !ALREADY_LIST.has(t)))('%s[]', (type) => {
        it('round-trips as an array and yields a PLAIN array, not a wrapper', async () => {
            const { value } = await roundTrip(type, true);
            expect(Array.isArray(value)).toBeTrue();
            assertPlain(value);
            // a response is serialized with JSON.stringify, so a wrapper would show up here
            expect(JSON.stringify(value)).toStartWith('[');
        });

        it('yields exactly what DataFrame yields as an array', async () => {
            const { value, expected } = await roundTrip(type, true);
            expect(value).toEqual(expected);
        });

        it('has a table schema matching its declared array config', async () => {
            const { mismatches } = await roundTrip(type, true);
            expect(mismatches).toEqual([]);
        });
    });
});

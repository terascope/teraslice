import 'jest-extended';
import { FieldType, DataTypeConfig, DataTypeFields } from '@terascope/types';
import { DuckFrame, closeDuckDatabase } from '../../src/duck-frame/DuckFrame.js';
import { diffSchema } from '../../src/duck-frame/schema-check.js';

/**
 * One sample value per FieldType, in the form the ES client would hand us.
 *
 * The point is a round trip: `fromRecords` -> table -> `rows()`. That is the whole lifecycle
 * data-mate is responsible for, and it is where representation gotchas hide - the
 * `DuckDBListValue` leak was found exactly this way.
 */
const SAMPLES: Partial<Record<FieldType, unknown>> = {
    [FieldType.Boolean]: true,
    [FieldType.Byte]: 12,
    [FieldType.Short]: 1200,
    [FieldType.Integer]: 120000,
    [FieldType.Long]: '9007199254740993',
    [FieldType.Float]: 1.5,
    [FieldType.Double]: 2.5,
    [FieldType.Number]: 3.5,
    [FieldType.Keyword]: 'kw',
    [FieldType.KeywordCaseInsensitive]: 'KW',
    [FieldType.KeywordTokens]: 'a b',
    [FieldType.KeywordTokensCaseInsensitive]: 'A B',
    [FieldType.KeywordPathAnalyzer]: 'a/b',
    [FieldType.NgramTokens]: 'abc',
    [FieldType.Text]: 'some text',
    [FieldType.String]: 'str',
    [FieldType.Domain]: 'example.com',
    [FieldType.Hostname]: 'host.example.com',
    [FieldType.IP]: '1.2.3.4',
    [FieldType.IPRange]: '1.2.3.0/24',
    [FieldType.Date]: '2026-01-02T03:04:05.000Z',
    [FieldType.Binary]: 'aGVsbG8=',
    [FieldType.GeoPoint]: '22.5,-90.5',
    [FieldType.Geo]: '22.5,-90.5',
    [FieldType.Boundary]: ['10,10', '20,20'],
    [FieldType.GeoJSON]: { type: 'Point', coordinates: [-90.5, 22.5] },
    [FieldType.Any]: { anything: 1 },
    [FieldType.Object]: { region: 'us' },
    [FieldType.Vector]: 1.5,
};

/** Types whose sample is inherently a list, so they cannot also be tested as an array-of. */
const ALREADY_LIST = new Set<FieldType>([
    // Boundary is a list of points by definition. Vector is NOT - type-coercion maps it with
    // `toFloatOrThrow` per value, so a multi-value Vector is declared `array: true`.
    FieldType.Boundary,
]);

/** Object needs declared children to become a STRUCT rather than JSON. */
const CHILDREN: Partial<Record<FieldType, DataTypeFields>> = {
    [FieldType.Object]: { region: { type: FieldType.Keyword } },
};

const ALL_TYPES = Object.keys(SAMPLES) as FieldType[];

async function roundTrip(
    type: FieldType, array: boolean
): Promise<{ value: unknown; mismatches: unknown[] }> {
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

    const frame = await DuckFrame.fromRecords(config, [record], { name: `sweep_${type}` });
    try {
        const rows: Record<string, unknown>[] = [];
        for await (const row of frame.rows()) rows.push(row);
        return { value: rows[0]?.field, mismatches: await diffSchema(frame) };
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
            // JSON.stringify is what the response path does - a wrapper shows up here
            expect(JSON.stringify(value)).toStartWith('[');
        });

        it('has a table schema matching its declared array config', async () => {
            const { mismatches } = await roundTrip(type, true);
            expect(mismatches).toEqual([]);
        });
    });
});

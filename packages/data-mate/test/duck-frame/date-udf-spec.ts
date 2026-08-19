import 'jest-extended';
import { timestampValue } from '@duckdb/node-api';
import { FieldType, DataTypeConfig } from '@terascope/types';
import {
    DuckFrame, closeDuckDatabase, registerScalarFunction
} from '../../src/duck-frame/DuckFrame.js';
import { makeInputConverter } from '../../src/duck-frame/duck-values.js';
import { duckFrameAdapter } from '../../src/adapters/duck-frame-adapter/index.js';
import { functionConfigRepository } from '../../src/function-configs/index.js';
import { FunctionDefinitionConfig } from '../../src/function-configs/interfaces.js';

const repo = functionConfigRepository as Record<string, FunctionDefinitionConfig<any>>;

/**
 * **What a date UDF receives, and why it cannot be a `DuckDBTimestampValue`.**
 *
 * `createScalarFunction` used to hand DuckDB's value straight to the JS function. A `Date` column
 * arrives as a `DuckDBTimestampValue`, whose `toString()` is `'2026-08-14 01:02:03.456'` -
 * space-separated and **zone-less**. Every date primitive coerces an object by stringifying it, so
 * the value went through `new Date('2026-08-14 01:02:03.456')`, which parses a zone-less string as
 * **MACHINE-LOCAL**. Every date function's input therefore drifted by the host's UTC offset.
 *
 * **These tests have to work on a UTC machine, where the bug is invisible.** Under `TZ=UTC` the
 * drift is zero, so an end-to-end "is the answer right" assertion passes either way - and jest
 * caches `TZ` in the VM context at startup, so a test cannot switch it (see docs/HANDOFF.md,
 * Appendix B). So the guards here are: the converter's exact numeric result, the arithmetic
 * identity that describes the old bug for ANY host offset, and - the real wiring guard - an
 * assertion about the JS TYPE the function is handed.
*/

/** 2026-08-14T01:02:03.456Z */
const MILLIS = 1786669323456;
const MICROS = BigInt(MILLIS) * 1000n;

describe('date values crossing the UDF boundary', () => {
    describe('makeInputConverter', () => {
        it('should convert a DuckDB TIMESTAMP to exact epoch millis', () => {
            const convert = makeInputConverter(FieldType.Date);

            expect(convert(timestampValue(MICROS))).toBe(MILLIS);
        });

        it('should return a plain number, which is what DateVector holds', () => {
            const converted = makeInputConverter(FieldType.Date)(timestampValue(MICROS));

            expect(typeof converted).toBe('number');
        });

        it('should describe the old defect exactly, for any host timezone', () => {
            const value = timestampValue(MICROS);

            // zone-less, which is the whole problem
            expect(String(value)).toBe('2026-08-14 01:02:03.456');

            // the identity the bug obeyed: parsing that string drifts by the host's offset. It
            // holds under every TZ - and collapses to equality only under UTC, which is why a
            // UTC-only test suite could never have caught this.
            const offsetMinutes = -new Date().getTimezoneOffset();
            expect(new Date(String(value)).getTime()).toBe(MILLIS - (offsetMinutes * 60_000));

            // the converter never goes near a string
            expect(makeInputConverter(FieldType.Date)(value)).toBe(MILLIS);
        });

        it('should pass every other type through untouched', () => {
            // measured: these already arrive as what the primitives expect, so converting them
            // would be inventing a second coercion layer
            for (const type of [
                FieldType.Keyword,
                FieldType.IP,
                FieldType.Text,
                FieldType.Double,
                FieldType.Float,
                FieldType.Number,
                FieldType.Boolean,
                FieldType.Long,
                FieldType.Integer,
            ]) {
                const convert = makeInputConverter(type);

                expect(convert('abc')).toBe('abc');
                expect(convert(2.5)).toBe(2.5);
                expect(convert(9007199254740993n)).toBe(9007199254740993n);
                expect(convert(null)).toBeNull();
            }
        });

        it('should leave a nil alone rather than inventing an epoch', () => {
            const convert = makeInputConverter(FieldType.Date);

            expect(convert(null)).toBeNull();
            expect(convert(undefined)).toBeUndefined();
        });
    });

    describe('the wiring, through a real query', () => {
        const CONFIG: DataTypeConfig = {
            version: 1,
            fields: {
                created: { type: FieldType.Date },
                stamps: { type: FieldType.Date, array: true },
            },
        };

        let frame: DuckFrame;

        beforeAll(async () => {
            frame = await DuckFrame.fromRecords(CONFIG, [{
                created: '2026-08-14T01:02:03.456Z',
                stamps: ['2026-08-14T01:02:03.456Z', '2026-01-14T23:59:59.999Z'],
            }], { name: 'date_udf' });
        });

        afterAll(async () => {
            await frame.destroy();
            await closeDuckDatabase();
        });

        /**
         * Registers a UDF that records what it was handed, and drains a query through it.
         *
         * **This is the guard that works on a UTC machine**: it asserts the JS TYPE and value the
         * function receives, not the answer the function computes - so it fails if the converter
         * is ever unwired, whatever the host timezone.
        */
        async function capture(field: string): Promise<unknown[]> {
            const seen: unknown[] = [];
            const name = `capture_${field}`;

            await registerScalarFunction({
                name,
                parameter: FieldType.Date,
                returns: { type: FieldType.Long },
                fn: (value) => {
                    seen.push(value);
                    return 1;
                },
            });

            const fieldConfig = CONFIG.fields[field] as { array?: boolean };
            const expression = fieldConfig.array
                ? `list_transform("${field}", x -> ${name}(x))`
                : `${name}("${field}")`;

            const projected = frame.select(
                { out: expression },
                { version: 1, fields: { out: { type: FieldType.Long, array: fieldConfig.array } } }
            );

            for await (const _row of projected.rows()) { /* drain */ }

            return seen;
        }

        it('should hand the function a number, never a DuckDBTimestampValue', async () => {
            const seen = await capture('created');

            expect(seen).toHaveLength(1);
            expect(typeof seen[0]).toBe('number');
            expect(seen[0]).toBe(MILLIS);
        });

        it('should convert each element of a Date array too', async () => {
            const seen = await capture('stamps');

            expect(seen).toEqual([MILLIS, 1768435199999]);
            for (const value of seen) expect(typeof value).toBe('number');
        });

        /**
         * The instant-comparing validations, which are the clearest evidence: they are not
         * locale-dependent at all, so a shifted input simply makes them wrong. Before the fix
         * these flipped between `TZ=UTC` and `TZ=America/New_York`.
        */
        it.each([
            ['isBefore', { date: '2026-08-14T03:00:00.000Z' }, true],
            ['isAfter', { date: '2026-08-14T03:00:00.000Z' }, false],
            ['isBetween',
                {
                    start: '2026-08-14T00:00:00.000Z', end: '2026-08-14T03:00:00.000Z',
                },
                true],
        ])('should get %s right, independent of the host timezone', async (name, args, passes) => {
            const adapted = await duckFrameAdapter(repo[name], {
                field: 'created',
                inputConfig: { field_config: CONFIG.fields.created },
                args,
            });
            const projected = frame.select(
                { created: adapted.expression },
                { version: 1, fields: { created: adapted.outputConfig.field_config } }
            );

            const rows: Record<string, unknown>[] = [];
            for await (const row of projected.rows()) rows.push(row);

            // a validation nulls the value and keeps the row, so "did it pass" is "did the value
            // survive" - and the instant is 01:02:03Z, which IS before 03:00:00Z
            expect(rows[0].created == null).toBe(!passes);
        });

        it('should read the UTC hour off the stored instant', async () => {
            const adapted = await duckFrameAdapter(repo.getUTCHours, {
                field: 'created',
                inputConfig: { field_config: CONFIG.fields.created },
            });
            const projected = frame.select(
                { hour: adapted.expression },
                { version: 1, fields: { hour: adapted.outputConfig.field_config } }
            );

            const rows: Record<string, unknown>[] = [];
            for await (const row of projected.rows()) rows.push(row);

            expect(Number(rows[0].hour)).toBe(1);
        });
    });
});

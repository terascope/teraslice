import 'jest-extended';
import { timestampValue, structValue } from '@duckdb/node-api';
import { FieldType, DataTypeConfig } from '@terascope/types';
import {
    TealFrame, closeDuckDatabase, registerScalarFunction, makeInputConverter, tealFrameAdapter,
    functionConfigRepository, FunctionDefinitionConfig
} from '../../src/index.js';

const repo = functionConfigRepository as Record<string, FunctionDefinitionConfig<any>>;

/**
 * Tests what a date UDF receives: epoch millis or a `[ms, offset]` DateTuple, never a
 * `DuckDBTimestampValue`.
 *
 * A date is stored as `{ ms, tz_offset }` (`date-value.ts`), so a UDF gets exactly what
 * `DateVector` holds and nothing is parsed. A raw `DuckDBTimestampValue` would be wrong: its
 * `toString()` is zone-less (`'2026-08-14 01:02:03.456'`), the date primitives coerce objects by
 * stringifying them, and `new Date()` parses a zone-less string in the host's local time, so
 * every input would shift by the host's UTC offset.
 *
 * These tests must also catch that on a UTC machine, where the shift is zero. Jest fixes `TZ` at
 * startup, so a test cannot switch it. The checks are therefore the converter's exact numeric
 * result, an arithmetic identity that holds for any host offset, and an assertion about the JS
 * type the function is handed.
*/

/** 2026-08-14T01:02:03.456Z */
const MILLIS = 1786669323456;
const MICROS = BigInt(MILLIS) * 1000n;

/** A stored date, as DuckDB hands it to a UDF. */
function storedDate(offset: number | null = null) {
    return structValue({ ms: BigInt(MILLIS), tz_offset: offset });
}

describe('date values crossing the UDF boundary', () => {
    describe('makeInputConverter', () => {
        it('should convert a stored date to exact epoch millis', () => {
            const convert = makeInputConverter(FieldType.Date);

            expect(convert(storedDate())).toBe(MILLIS);
        });

        it('should return a plain number, which is what DateVector holds', () => {
            const converted = makeInputConverter(FieldType.Date)(storedDate());

            expect(typeof converted).toBe('number');
        });

        it('should return a DateTuple when the date carries an offset', () => {
            expect(makeInputConverter(FieldType.Date)(storedDate(120))).toEqual([MILLIS, 120]);
        });

        it('should describe the old defect exactly, for any host timezone', () => {
            const value = timestampValue(MICROS);

            // DuckDB's string form has no zone
            expect(String(value)).toBe('2026-08-14 01:02:03.456');

            // parsing that string shifts it by the host's offset. This holds under every TZ and
            // reduces to equality only under UTC, so an end-to-end check alone would miss it.
            const offsetMinutes = -new Date().getTimezoneOffset();
            expect(new Date(String(value)).getTime()).toBe(MILLIS - (offsetMinutes * 60_000));

            // the converter never goes through a string
            expect(makeInputConverter(FieldType.Date)(storedDate())).toBe(MILLIS);
        });

        it('should pass every other type through untouched', () => {
            // these already arrive as what the primitives expect, so converting them would add
            // a second coercion layer
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

        let frame: TealFrame;

        beforeAll(async () => {
            frame = await TealFrame.fromRecords(CONFIG, [{
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
         * It asserts the JS type and value the function receives rather than the answer it
         * computes, so it fails if the converter is unwired even on a UTC host.
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
                { out: expression }, {
                    config:
                { version: 1, fields: { out: { type: FieldType.Long, array: fieldConfig.array } } }
                });

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
         * The instant-comparing validations do not depend on locale, so a shifted input makes
         * them wrong outright. With a zone-less input their result would change between
         * `TZ=UTC` and `TZ=America/New_York`.
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
            const adapted = await tealFrameAdapter(repo[name], {
                field: 'created',
                inputConfig: { field_config: CONFIG.fields.created },
                args,
            });
            const projected = frame.select(
                { created: adapted.expression }, {
                    config:
                { version: 1, fields: { created: adapted.outputConfig.field_config } }
                });

            const rows: Record<string, unknown>[] = [];
            for await (const row of projected.rows()) rows.push(row);

            // a validation nulls the value and keeps the row, so it passed if the value survived.
            // The instant is 01:02:03Z, which is before 03:00:00Z.
            expect(rows[0].created == null).toBe(!passes);
        });

        it('should read the UTC hour off the stored instant', async () => {
            const adapted = await tealFrameAdapter(repo.getUTCHours, {
                field: 'created',
                inputConfig: { field_config: CONFIG.fields.created },
            });
            const projected = frame.select(
                { hour: adapted.expression }, {
                    config:
                { version: 1, fields: { hour: adapted.outputConfig.field_config } }
                });

            const rows: Record<string, unknown>[] = [];
            for await (const row of projected.rows()) rows.push(row);

            expect(Number(rows[0].hour)).toBe(1);
        });
    });
});

import 'jest-extended';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rmSync, mkdtempSync } from 'node:fs';
import { FieldType, DataTypeConfig } from '@terascope/types';
import { DuckFrame, CoercionFailureError } from '../../src/duck-frame/index.js';
import { describeColumns } from '../../src/duck-frame/schema-check.js';

/**
 * A `Long` must arrive, be stored, be read back and cross the Parquet wire EXACTLY.
 *
 * Two defects this pins, both found 2026-09-28:
 *
 * - **The wire.** `Long` was a `HUGEINT`, and Parquet has no 128-bit integer, so DuckDB wrote it
 *   as a DOUBLE: every value past 2^53 changed on the way from qpl-search-api to the worker, and
 *   `9223372036854775807` came back as a value that no longer fits in 64 bits. A `Long` column is
 *   now a `BIGINT` - an Elasticsearch `long` is exactly a signed 64-bit integer, and Parquet
 *   carries it as INT64.
 * - **A bigint input.** `core-utils`' `toBigIntOrThrow` adds 1 above the safe limit to a value it
 *   PARSED and returns a bigint input untouched, and the ingest converter subtracted 1 from both,
 *   so `9007199254740993n` was stored as `...992`. See DEF-BIGINT / #4555.
*/
const CONFIG: DataTypeConfig = {
    version: 1,
    fields: {
        _key: { type: FieldType.Keyword },
        n: { type: FieldType.Long },
        obj: { type: FieldType.Object },
        'obj.n': { type: FieldType.Long },
        list: { type: FieldType.Long, array: true },
    },
};

const VALUES = [
    '0',
    '42',
    '-1',
    '9007199254740993', // one past the safe limit: the off-by-one case
    '-9007199254740993',
    '9223372036854775807', // int64 max
    '-9223372036854775808', // int64 min
];

/** Every value in every position a Long can occupy. */
function records(toInput: (value: string) => unknown) {
    return VALUES.map((value, i) => ({
        _key: `k${i}`,
        n: toInput(value),
        obj: { n: toInput(value) },
        list: [toInput(value), toInput('7')],
    }));
}

/** Exact decimal text for every Long, straight out of DuckDB - no JS number involved. */
async function stored(frame: DuckFrame): Promise<string[][]> {
    const rows = await frame.rawRows(
        `SELECT n::VARCHAR, obj.n::VARCHAR, list::VARCHAR FROM ${frame.from} ORDER BY _key`
    );
    return rows.map((row) => row.map(String));
}

const EXPECTED = VALUES.map((value) => [value, value, `[${value}, 7]`]);

/** The JSON rule: a number while it fits exactly, an exact string past 2^53 - 1. */
function plain(value: string): number | string {
    const big = BigInt(value);
    const safe = BigInt(Number.MAX_SAFE_INTEGER);
    return big > safe || big < -safe ? value : Number(value);
}

describe('DuckFrame Long values are exact end to end', () => {
    let dir: string;

    beforeAll(() => {
        dir = mkdtempSync(join(tmpdir(), 'long-exact-'));
    });

    afterAll(() => {
        rmSync(dir, { recursive: true, force: true });
    });

    describe.each([
        ['a string', (value: string) => value],
        ['a bigint', (value: string) => BigInt(value)],
    ])('when the input is %s', (_label, toInput) => {
        let frame: DuckFrame;

        beforeAll(async () => {
            frame = await DuckFrame.fromRecords(CONFIG, records(toInput));
        });

        afterAll(async () => {
            await frame.destroy();
        });

        it('should store a Long column as a BIGINT', async () => {
            const columns = await describeColumns(frame);
            expect(columns.n).toEqual('BIGINT');
            expect(columns.list).toEqual('BIGINT[]');
            expect(columns.obj).toContain('BIGINT');
        });

        it('should store every value exactly', async () => {
            expect(await stored(frame)).toEqual(EXPECTED);
        });

        it('should read every value back exactly through rows() and ndjson()', async () => {
            const rows: Record<string, any>[] = [];
            for await (const row of frame.rows()) rows.push(row);

            const lines: Record<string, any>[] = [];
            for await (const line of frame.ndjson()) lines.push(JSON.parse(line));

            for (const out of [rows, lines]) {
                expect(out.map((row) => row.n)).toEqual(VALUES.map(plain));
                expect(out.map((row) => row.obj.n)).toEqual(VALUES.map(plain));
                expect(out.map((row) => row.list)).toEqual(VALUES.map((v) => [plain(v), 7]));
            }
        });

        it('should carry every value exactly over the Parquet wire', async () => {
            const file = join(dir, `wire-${typeof toInput('1')}.parquet`);
            await frame.writeParquet(file);

            const relation = await DuckFrame.fromParquet(CONFIG, file);
            expect(await stored(relation)).toEqual(EXPECTED);
            expect(await describeColumns(relation)).toMatchObject({ n: 'BIGINT' });

            const table = await DuckFrame.create(CONFIG);
            await table.append({ parquet: file });
            expect(await stored(table)).toEqual(EXPECTED);

            await Promise.all([relation.destroy(), table.destroy()]);
        });
    });

    describe('a value outside the signed 64-bit range', () => {
        const OUT_OF_RANGE = ['9223372036854775808', '-9223372036854775809'];

        it.each(OUT_OF_RANGE)('should reject %s in strict mode rather than store it wrong', async (value) => {
            await expect(DuckFrame.fromRecords(CONFIG, [{ _key: 'a', n: value }]))
                .rejects.toThrow(CoercionFailureError);
            await expect(DuckFrame.fromRecords(CONFIG, [{ _key: 'a', n: BigInt(value) }]))
                .rejects.toThrow(CoercionFailureError);
        });

        // a failed coercion nulls the whole field value, so one bad element nulls its list
        it('should null the field value in lenient mode', async () => {
            const frame = await DuckFrame.fromRecords(
                CONFIG,
                OUT_OF_RANGE.map((n, i) => ({ _key: `k${i}`, n, obj: { n }, list: [n, '7'] })),
                { mode: 'lenient' }
            );
            expect(await stored(frame)).toEqual([
                ['null', 'null', 'null'],
                ['null', 'null', 'null'],
            ]);
            await frame.destroy();
        });
    });

    describe('a computed Long wider than 64 bits', () => {
        /**
         * `ipToInt` returns a `Long`, and an IPv6 address is 128 bits, so a COMPUTED Long can
         * exceed what a stored one can hold. It stays exact in the query; what it must never do
         * is cross the wire as a DOUBLE.
        */
        it('should fail writeParquet loudly rather than write a rounded value', async () => {
            const base = await DuckFrame.fromRecords(CONFIG, [{ _key: 'a', n: '1' }]);
            const wide = base.select({
                _key: '_key',
                n: `'42540488320432167789079031612388147199'::HUGEINT`,
            });

            await expect(wide.writeParquet(join(dir, 'wide.parquet'))).rejects.toThrow();
            await base.destroy();
        });

        /**
         * Found in review: DuckDB's DESCRIBE text does not quote struct member names, so a TEXT
         * substitution of `HUGEINT` renamed a member called `HUGEINT` and nulled its value -
         * silently. The narrowing now reads type OBJECTS and casts to the DECLARED type.
        */
        it('should keep a nested field NAMED HUGEINT through writeParquet', async () => {
            const config: DataTypeConfig = {
                version: 1,
                fields: {
                    obj: { type: FieldType.Object },
                    'obj.HUGEINT': { type: FieldType.Long },
                    'obj.other': { type: FieldType.Keyword },
                },
            };
            const frame = await DuckFrame.fromRecords(config, [{ obj: { HUGEINT: 42n, other: 'hi' } }]);
            const file = join(dir, 'member-named-hugeint.parquet');
            await frame.writeParquet(file);

            const back = await DuckFrame.fromParquet(config, file);
            const rows: Record<string, any>[] = [];
            for await (const row of back.rows()) rows.push(row);
            expect(rows).toEqual([{ obj: { HUGEINT: 42, other: 'hi' } }]);
            await Promise.all([frame.destroy(), back.destroy()]);
        });

        it('should refuse to write an UNDECLARED 128-bit column rather than guess its type', async () => {
            const base = await DuckFrame.fromRecords(CONFIG, [{ _key: 'a', n: '1' }]);
            const extra = base.select(
                { _key: '_key', extra: 'n::HUGEINT' },
                { config: { version: 1, fields: { _key: { type: FieldType.Keyword } } } }
            );

            await expect(extra.writeParquet(join(dir, 'undeclared.parquet')))
                .rejects.toThrow(/extra.*128-bit/);
            await base.destroy();
        });

        it('should write a computed Long that fits in 64 bits exactly, as INT64', async () => {
            const base = await DuckFrame.fromRecords(CONFIG, [{ _key: 'a', n: '9223372036854775806' }]);
            const computed = base.select({ _key: '_key', n: 'n::HUGEINT + 1' });
            const file = join(dir, 'computed.parquet');
            await computed.writeParquet(file);

            const back = await DuckFrame.fromParquet(CONFIG, file);
            expect(await back.rawRows(`SELECT n::VARCHAR, typeof(n) FROM ${back.from}`))
                .toEqual([['9223372036854775807', 'BIGINT']]);
            await Promise.all([base.destroy(), back.destroy()]);
        });
    });
});

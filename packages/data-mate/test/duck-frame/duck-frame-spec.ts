import 'jest-extended';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { unlinkSync, existsSync } from 'node:fs';
import { FieldType, DataTypeConfig } from '@terascope/types';
import { DuckFrame, CoercionFailureError, closeDuckDatabase } from '../../src/duck-frame/DuckFrame.js';

const CONFIG: DataTypeConfig = {
    version: 1,
    fields: {
        _key: { type: FieldType.Keyword },
        ip: { type: FieldType.IP },
        created: { type: FieldType.Date },
        bytes: { type: FieldType.Integer },
        tags: { type: FieldType.Keyword, array: true },
        meta: { type: FieldType.Object },
        'meta.region': { type: FieldType.Keyword },
        'meta.tier': { type: FieldType.Integer },
    },
};

const RECORDS = [
    {
        _key: 'a', ip: '1.2.3.4', created: '2026-01-02T03:04:05.000Z',
        bytes: '1e3', tags: ['x', 'y'], meta: { region: 'us', tier: '2' },
    },
    {
        _key: 'b', ip: '::1', created: 1710028800000,
        bytes: 12.7, tags: 'solo', meta: { region: 'eu', tier: 1, drop: 'me' },
    },
    {
        _key: 'c', ip: null, created: '2026', bytes: null, tags: null, meta: null
    },
];

describe('DuckFrame', () => {
    afterAll(async () => {
        await closeDuckDatabase();
    });

    describe('fromRecords', () => {
        it('should build a frame from JS records, the shape callers actually have', async () => {
            const frame = await DuckFrame.fromRecords(CONFIG, RECORDS, {});
            expect(await frame.size()).toEqual(3);
            await frame.destroy();
        });

        it('should report the folded column set, with children inside their parent', async () => {
            const frame = await DuckFrame.fromRecords(CONFIG, RECORDS, {});
            expect(frame.columns).toEqual(['_key', 'ip', 'created', 'bytes', 'tags', 'meta']);
            await frame.destroy();
        });

        it('should coerce by DataType rather than by DuckDB cast rules', async () => {
            const frame = await DuckFrame.fromRecords(CONFIG, RECORDS, {});
            const rows = await frame.query(
                `SELECT bytes::VARCHAR FROM ${frame.from} ORDER BY _key`
            );
            // '1e3' -> 1000, and 12.7 truncates to 12 (a DuckDB cast would round to 13)
            expect(rows.slice(0, 2).map((r) => String(r[0]))).toEqual(['1000', '12']);
            await frame.destroy();
        });

        it('should castArray a scalar and keep a null array null', async () => {
            const frame = await DuckFrame.fromRecords(CONFIG, RECORDS, {});
            const rows = await frame.query(
                `SELECT tags::VARCHAR FROM ${frame.from} ORDER BY _key`
            );
            expect(String(rows[1][0])).toEqual('[solo]');
            expect(rows[2][0]).toBeNull();
            await frame.destroy();
        });

        it('should drop object keys absent from the config', async () => {
            const frame = await DuckFrame.fromRecords(CONFIG, RECORDS, {});
            const rows = await frame.query(
                `SELECT meta::VARCHAR FROM ${frame.from} WHERE _key = 'b'`
            );
            // the record carried an extra 'drop' key, which is not in the config
            expect(String(rows[0][0])).not.toInclude('drop');
            await frame.destroy();
        });

        it('should raise a CoercionFailureError naming the field and value', async () => {
            const bad = [{ ...RECORDS[0], bytes: 'not-a-number' }];
            expect.assertions(4);
            try {
                await DuckFrame.fromRecords(CONFIG, bad, {});
            } catch (err) {
                expect(err).toBeInstanceOf(CoercionFailureError);
                const e = err as CoercionFailureError;
                expect(e.failures).toHaveLength(1);
                expect(e.failures[0].field).toEqual('bytes');
                // the ORIGINAL text is what is useful for something that fires rarely
                expect(e.failures[0].exampleValue).toEqual('not-a-number');
            }
        });

        it('should null the value instead of raising in lenient mode', async () => {
            // the pipeline contract: failing to convert is an answer, not an error
            const frame = await DuckFrame.fromRecords(
                CONFIG, [{ ...RECORDS[0], bytes: 'not-a-number' }], { mode: 'lenient' }
            );
            const rows = await frame.query(`SELECT bytes FROM ${frame.from}`);
            expect(rows[0][0]).toBeNull();
            await frame.destroy();
        });

        it('should round-trip a Long above 2^53 without losing or gaining 1', async () => {
            // toBigIntOrThrow adds 1 above MAX_SAFE_INTEGER and bigIntToJSON removes it;
            // taking the bigint directly gets the +1 without the -1, which stored
            // '9007199254740993' as ...994
            const cfg: DataTypeConfig = {
                version: 1,
                fields: { total: { type: FieldType.Long } },
            };
            const frame = await DuckFrame.fromRecords(
                cfg, [{ total: '9007199254740993' }], { name: 'bigint' }
            );
            const rows = await frame.query(`SELECT total::VARCHAR FROM ${frame.from}`);
            expect(String(rows[0][0])).toEqual('9007199254740993');
            await frame.destroy();
        });

        it('should decode a geohash, since coerceToType calls parseGeoPoint', async () => {
            // the SQL path could not express this at all; using the primitive gets it free
            const cfg: DataTypeConfig = {
                version: 1,
                fields: { loc: { type: FieldType.GeoPoint } },
            };
            const frame = await DuckFrame.fromRecords(
                cfg, [{ loc: 'ezs42' }], { name: 'geohash' }
            );
            const rows = await frame.query(`SELECT loc.lat::VARCHAR, loc.lon::VARCHAR FROM ${frame.from}`);
            expect(rows[0].map(String)).toEqual(['42.605', '-5.603']);
            await frame.destroy();
        });

        it('should give each frame its own table', async () => {
            const a = await DuckFrame.fromRecords(CONFIG, RECORDS, {});
            const b = await DuckFrame.fromRecords(CONFIG, RECORDS, {});
            expect(a.table).not.toEqual(b.table);
            await a.destroy();
            await b.destroy();
        });
    });

    describe('Parquet round trip', () => {
        const path = join(tmpdir(), 'duck-frame-spec.parquet');

        afterEach(() => {
            if (existsSync(path)) unlinkSync(path);
        });

        it('should round-trip through Parquet without re-coercing', async () => {
            const source = await DuckFrame.fromRecords(CONFIG, RECORDS, {});
            await source.writeParquet(path);
            const restored = await DuckFrame.fromParquet(CONFIG, path, {});

            expect(await restored.size()).toEqual(3);
            const a = await source.query(`SELECT * FROM ${source.from} ORDER BY _key`);
            const b = await restored.query(`SELECT * FROM ${restored.from} ORDER BY _key`);
            expect(JSON.stringify(b)).toEqual(JSON.stringify(a));

            await source.destroy();
            await restored.destroy();
        });

        it('should preserve nested and list values across transport', async () => {
            const source = await DuckFrame.fromRecords(CONFIG, RECORDS, {});
            await source.writeParquet(path);
            const restored = await DuckFrame.fromParquet(CONFIG, path, {});
            const rows = await restored.query(
                `SELECT tags::VARCHAR, meta.region, meta.tier::VARCHAR`
                + ` FROM ${restored.from} WHERE _key = 'a'`
            );
            expect(rows[0].map(String)).toEqual(['[x, y]', 'us', '2']);
            await source.destroy();
            await restored.destroy();
        });
    });

    describe('rows (streaming output path)', () => {
        it('should stream every row as an object', async () => {
            const frame = await DuckFrame.fromRecords(CONFIG, RECORDS, {});
            const out: Record<string, unknown>[] = [];
            for await (const row of frame.rows()) out.push(row);
            expect(out).toHaveLength(3);
            expect(Object.keys(out[0])).toEqual([...frame.columns]);
            await frame.destroy();
        });

        it('should be lazy, not a materialized array', async () => {
            // the engine's output path takes an Iterable and may stop early
            const frame = await DuckFrame.fromRecords(CONFIG, RECORDS, {});
            const iterator = frame.rows();
            const first = await iterator.next();
            expect(first.done).toBeFalse();
            expect(first.value._key).toEqual('a');
            await iterator.return?.();
            await frame.destroy();
        });

        it('should stream a result larger than one DuckDB chunk', async () => {
            // a chunk holds at most 2048 rows, so this crosses the boundary where a
            // single-chunk implementation would silently truncate
            const many = Array.from({ length: 5000 }, (_unused, i) => ({
                ...RECORDS[0], _key: `k-${i}`,
            }));
            const frame = await DuckFrame.fromRecords(CONFIG, many, { name: 'big' });
            let count = 0;
            const seen = new Set<string>();
            for await (const row of frame.rows()) {
                count += 1;
                seen.add(String(row._key));
            }
            expect(count).toEqual(5000);
            expect(seen.size).toEqual(5000);
            await frame.destroy();
        });

        it('should stream an empty frame without yielding', async () => {
            const frame = await DuckFrame.fromRecords(CONFIG, RECORDS, {});
            await frame.query(`DELETE FROM ${frame.table}`);
            const out = [];
            for await (const row of frame.rows()) out.push(row);
            expect(out).toEqual([]);
            await frame.destroy();
        });
    });

    describe('queries', () => {
        it('should aggregate over a nested struct field', async () => {
            const frame = await DuckFrame.fromRecords(CONFIG, RECORDS, {});
            const rows = await frame.query(
                `SELECT meta.region, count(*) FROM ${frame.from}`
                + ' WHERE meta.region IS NOT NULL GROUP BY meta.region ORDER BY 1'
            );
            expect(rows.map((r) => String(r[0]))).toEqual(['eu', 'us']);
            await frame.destroy();
        });
    });

    describe('relation vs materialized', () => {
        it('should build fromRecords as a materialized table', async () => {
            const frame = await DuckFrame.fromRecords(CONFIG, RECORDS, {});
            expect(frame.isMaterialized).toBeTrue();
            await frame.destroy();
        });

        it('should make a projection relation-backed, not a copy', async () => {
            const frame = await DuckFrame.fromRecords(CONFIG, RECORDS, {});
            const projected = frame.select({ _key: '_key', doubled: 'bytes * 2' });
            expect(projected.isMaterialized).toBeFalse();
            expect(projected.columns).toEqual(['_key', 'doubled']);
            await frame.destroy();
        });

        it('should leave the original untouched when projecting', async () => {
            // the plan uses both the mutated and unmutated frame, so purity is required
            const frame = await DuckFrame.fromRecords(CONFIG, RECORDS, {});
            const projected = frame.select({ only: 'bytes' });
            expect(frame.columns).toEqual([...frame.columns]);
            expect(await frame.size()).toEqual(3);
            expect(await projected.size()).toEqual(3);
            expect(projected.columns).toEqual(['only']);
            await frame.destroy();
        });

        it('should compose filter and select into one relation', async () => {
            const frame = await DuckFrame.fromRecords(CONFIG, RECORDS, {});
            const chained = frame.filter('bytes IS NOT NULL').select({ n: 'bytes' });
            expect(chained.isMaterialized).toBeFalse();
            expect(await chained.size()).toEqual(2);
            await frame.destroy();
        });

        it('should materialize a relation into a real table', async () => {
            const frame = await DuckFrame.fromRecords(CONFIG, RECORDS, {});
            const relation = frame.filter('bytes IS NOT NULL');
            const table = await relation.materialize('mat');
            expect(relation.isMaterialized).toBeFalse();
            expect(table.isMaterialized).toBeTrue();
            expect(await table.size()).toEqual(await relation.size());
            await table.destroy();
            await frame.destroy();
        });

        it('should return itself when materializing an already-materialized frame', async () => {
            const frame = await DuckFrame.fromRecords(CONFIG, RECORDS, {});
            expect(await frame.materialize()).toBe(frame);
            await frame.destroy();
        });

        it('should read Parquet as a relation, copying nothing', async () => {
            const p = join(tmpdir(), 'duck-frame-relation.parquet');
            const source = await DuckFrame.fromRecords(CONFIG, RECORDS, {});
            await source.writeParquet(p);
            const restored = await DuckFrame.fromParquet(CONFIG, p, {});
            expect(restored.isMaterialized).toBeFalse();
            expect(await restored.size()).toEqual(3);
            await source.destroy();
            unlinkSync(p);
        });

        it('should stream rows from a relation without materializing', async () => {
            const frame = await DuckFrame.fromRecords(CONFIG, RECORDS, {});
            const relation = frame.select({ k: '_key' });
            const out = [];
            for await (const row of relation.rows()) out.push(row.k);
            expect(out.sort()).toEqual(['a', 'b', 'c']);
            await frame.destroy();
        });
    });

    describe('rows() value shapes', () => {
        // REGRESSION: getColumnValues returns DuckDBListValue / struct wrappers, not plain JS.
        // rows() is the output path, so a wrapper would surface as {"items":[...]} in a user's
        // results. Nothing covered an array or struct through rows() before.
        it('should yield plain arrays and objects, not DuckDB value wrappers', async () => {
            const frame = await DuckFrame.fromRecords(CONFIG, RECORDS, { name: 'plain' });
            const [first] = await (async () => {
                const out = [];
                for await (const row of frame.rows()) out.push(row);
                return out;
            })();

            expect(Array.isArray(first.tags)).toBeTrue();
            expect(first.tags).toEqual(['x', 'y']);
            expect(first.meta).toEqual({ region: 'us', tier: 2 });
            expect(JSON.stringify(first.tags)).toEqual('["x","y"]');

            await frame.destroy();
        });
    });

    describe('stream isolation', () => {
        // REGRESSION: streams used to share the process-wide connection, and DuckDB silently
        // truncates an open streaming result when another query runs on that connection -
        // measured at 500,000 rows down to 100,352 with no error (docs/tools/conn-isolation.mjs).
        // Each stream now gets its own connection.
        const MANY = Array.from({ length: 5000 }, (_, i) => ({ _key: `k${i}` }));
        const KEY_ONLY = { version: 1, fields: { _key: { type: FieldType.Keyword } } };

        it('should not truncate a stream when another query runs mid-stream', async () => {
            const frame = await DuckFrame.fromRecords(
                KEY_ONLY as any, MANY, { name: 'stream_isolation' }
            );

            let seen = 0;
            for await (const _row of frame.rows()) {
                seen++;
                // one interleaved query, right inside the first chunk
                if (seen === 1) await frame.query(`SELECT count(*) FROM ${frame.from}`);
            }

            expect(seen).toEqual(MANY.length);
            await frame.destroy();
        });

        it('should run two streams over the same frame concurrently', async () => {
            const frame = await DuckFrame.fromRecords(
                KEY_ONLY as any, MANY, { name: 'stream_concurrent' }
            );

            const drain = async () => {
                let n = 0;
                for await (const _row of frame.rows()) n++;
                return n;
            };
            expect(await Promise.all([drain(), drain()]))
                .toEqual([MANY.length, MANY.length]);

            await frame.destroy();
        });
    });

    describe('destroy', () => {
        it('should drop the table and leave the database usable', async () => {
            const frame = await DuckFrame.fromRecords(CONFIG, RECORDS, {});
            await frame.destroy();
            expect(await frame.query('SELECT 1')).toEqual([[1]]);
        });
    });
});

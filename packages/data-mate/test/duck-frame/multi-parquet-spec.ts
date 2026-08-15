import 'jest-extended';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { unlinkSync, existsSync } from 'node:fs';
import { FieldType, DataTypeConfig } from '@terascope/types';
import {
    DuckFrame, AppendError, CoercionFailureError, closeDuckDatabase
} from '../../src/duck-frame/DuckFrame.js';

/**
 * The worker's ingest path: qpl-search-api turns Elasticsearch records into a frame and sends
 * Parquet back; the worker's slicers and fetches each bring back one payload, and the whole
 * search result must end up as ONE table.
*/
const CONFIG: DataTypeConfig = {
    version: 1,
    fields: {
        _key: { type: FieldType.Keyword },
        bytes: { type: FieldType.Integer },
        tags: { type: FieldType.Keyword, array: true },
    },
};

/** One api-server response worth of records. */
function slice(prefix: string, count: number): Record<string, unknown>[] {
    return Array.from({ length: count }, (_unused, index) => ({
        _key: `${prefix}-${index}`,
        bytes: index * 10,
        tags: [prefix],
    }));
}

async function collect(frame: DuckFrame): Promise<Record<string, unknown>[]> {
    const out: Record<string, unknown>[] = [];
    for await (const row of frame.rows()) out.push(row);
    return out;
}

describe('DuckFrame multi-Parquet ingest (the worker tier)', () => {
    const written: string[] = [];

    /** Produces one Parquet payload the way the api-server does. */
    async function payload(prefix: string, count: number): Promise<string> {
        const path = join(tmpdir(), `mp-${prefix}-${process.pid}.parquet`);
        const producer = await DuckFrame.fromRecords(CONFIG, slice(prefix, count), {
            name: `producer_${prefix}`,
        });
        await producer.writeParquet(path);
        await producer.destroy();
        written.push(path);
        return path;
    }

    afterAll(async () => {
        for (const path of written) {
            if (existsSync(path)) unlinkSync(path);
        }
        await closeDuckDatabase();
    });

    it('should be empty on creation, with no separate empty() factory needed', async () => {
        const frame = await DuckFrame.create(CONFIG, { name: 'accumulator_empty' });

        expect(frame.isMaterialized).toBeTrue();
        expect(frame.columns).toEqual(['_key', 'bytes', 'tags']);
        expect(await frame.size()).toBe(0);
        expect(await collect(frame)).toEqual([]);

        await frame.destroy();
    });

    it('should ingest many payloads into ONE table, as they arrive', async () => {
        const frame = await DuckFrame.create(CONFIG, { name: 'accumulator' });

        const first = await frame.append({ parquet: await payload('a', 3) });
        const second = await frame.append({ parquet: await payload('b', 5) });
        const third = await frame.append({ parquet: await payload('c', 2) });

        // the row count of each append is reported, which is what the worker's metrics want
        expect([first, second, third]).toEqual([3, 5, 2]);
        expect(await frame.size()).toBe(10);
        expect(frame.table).toBeString();

        const keys = (await collect(frame)).map((row) => String(row._key));
        expect(keys).toIncludeAllMembers(['a-0', 'b-4', 'c-1']);

        await frame.destroy();
    });

    it('should append several payloads in one call', async () => {
        const frame = await DuckFrame.create(CONFIG, { name: 'accumulator_list' });
        const paths = [await payload('d', 4), await payload('e', 6)];

        expect(await frame.append({ parquet: paths })).toBe(10);
        expect(await frame.size()).toBe(10);

        await frame.destroy();
    });

    it('should keep arrays intact through the Parquet round trip', async () => {
        const frame = await DuckFrame.create(CONFIG, { name: 'accumulator_arrays' });
        await frame.append({ parquet: await payload('f', 1) });

        expect(await collect(frame)).toEqual([{ _key: 'f-0', bytes: 0, tags: ['f'] }]);

        await frame.destroy();
    });

    it('should be queryable as one result once assembled', async () => {
        const frame = await DuckFrame.create(CONFIG, { name: 'accumulator_query' });
        await frame.append({ parquet: [await payload('g', 4), await payload('h', 4)] });

        const top = frame.filter('"bytes" >= 20')
            .orderBy([{ expression: 'bytes', direction: 'desc' }])
            .limit(3);

        expect((await collect(top)).map((row) => row.bytes)).toEqual([30, 30, 20]);
        expect(await frame.distinct().size()).toBe(8);

        await frame.destroy();
    });

    it('should read many payloads as ONE relation without a table', async () => {
        const paths = [await payload('i', 3), await payload('j', 3)];
        const relation = await DuckFrame.fromParquet(CONFIG, paths);

        expect(relation.isMaterialized).toBeFalse();
        expect(await relation.size()).toBe(6);

        // and materialize() turns that relation into the single table
        const table = await relation.materialize('assembled');
        expect(table.isMaterialized).toBeTrue();
        expect(await table.size()).toBe(6);
        await table.destroy();
    });

    it('should read a glob as ONE relation', async () => {
        await payload('glob1', 2);
        await payload('glob2', 3);

        const relation = await DuckFrame.fromParquet(
            CONFIG, join(tmpdir(), `mp-glob*-${process.pid}.parquet`)
        );

        expect(await relation.size()).toBe(5);
    });

    it('should promote a relation to a table rather than making the caller do it', async () => {
        // A caller should not have to know whether it is holding a table or a view to add data.
        const relation = await DuckFrame.fromParquet(CONFIG, await payload('k', 1));
        expect(relation.isMaterialized).toBeFalse();

        expect(await relation.append({ parquet: await payload('l', 2) })).toBe(2);

        expect(relation.isMaterialized).toBeTrue();
        expect(await relation.size()).toBe(3);

        await relation.destroy();
    });

    it('should leave the table untouched when an append fails', async () => {
        const frame = await DuckFrame.create(CONFIG, { name: 'accumulator_atomic' });
        await frame.append({ parquet: await payload('m', 4) });

        await expect(frame.append({ records: [{ _key: 'bad', bytes: 'not-a-number' }] }))
            .rejects.toThrow('coercion failed');
        await expect(frame.append({ parquet: join(tmpdir(), 'missing.parquet') }))
            .rejects.toThrow(/No files found/);

        // the four rows that were already assembled survive both failures
        expect(await frame.size()).toBe(4);

        await frame.destroy();
    });

    describe('when an append fails', () => {
        it('should say what was being added, where, and what survived', async () => {
            const frame = await DuckFrame.create(CONFIG, { name: 'accumulator_error' });
            await frame.append({ parquet: await payload('p', 4) });

            expect.assertions(7);
            try {
                await frame.append({ records: [{ _key: 'bad', bytes: 'not-a-number' }] });
            } catch (err) {
                const error = err as AppendError;

                expect(error).toBeInstanceOf(AppendError);
                expect(error.message).toInclude('1 record(s)');
                expect(error.message).toInclude('rolled back');
                expect(error.message).toInclude('still has 4 row(s)');
                expect(error.message).toInclude('coercion failed for field bytes');
                expect(error.failure.source).toBe('records');
                expect(error.failure.rowsRemaining).toBe(4);
            }

            await frame.destroy();
        });

        it('should name the payload when Parquet is the source', async () => {
            const frame = await DuckFrame.create(CONFIG, { name: 'accumulator_error_pq' });
            const missing = join(tmpdir(), 'nope.parquet');

            expect.assertions(3);
            try {
                await frame.append({ parquet: missing });
            } catch (err) {
                const error = err as AppendError;

                expect(error.message).toInclude(`Parquet "${missing}"`);
                expect(error.failure.source).toBe('parquet');
                expect(error.failure.rowsRemaining).toBe(0);
            }

            await frame.destroy();
        });

        it('should keep the underlying error as the cause', async () => {
            const frame = await DuckFrame.create(CONFIG, { name: 'accumulator_cause' });

            expect.assertions(2);
            try {
                await frame.append({ records: [{ _key: 'bad', bytes: 'not-a-number' }] });
            } catch (err) {
                const cause = (err as AppendError).cause as CoercionFailureError;

                expect(cause).toBeInstanceOf(CoercionFailureError);
                expect(cause.failures[0]).toMatchObject({
                    field: 'bytes', exampleValue: 'not-a-number',
                });
            }

            await frame.destroy();
        });

        it('should let fromRecords throw the plain coercion error, being one-shot', async () => {
            // Nothing survives a failed fromRecords, so AppendError's "what survived" context
            // would be noise - and the contract there is to throw what DataFrame throws.
            await expect(DuckFrame.fromRecords(CONFIG, [{ _key: 'x', bytes: 'nope' }], {}))
                .rejects.toBeInstanceOf(CoercionFailureError);
        });
    });

    describe('concurrent fetchers', () => {
        /**
         * The real worker shape: several fetches finish at once and all append to the same
         * frame. This is a REGRESSION TEST - the first implementation ran BEGIN/COMMIT on the
         * process-wide shared connection, where a second concurrent append's BEGIN throws
         * `cannot start a transaction within a transaction`, its ROLLBACK discards the FIRST
         * append's rows, and the connection is then poisoned for everyone.
        */
        it('should land every row when many append to one frame at once', async () => {
            const frame = await DuckFrame.create(CONFIG, { name: 'accumulator_concurrent' });
            const paths = await Promise.all(
                Array.from({ length: 8 }, (_unused, n) => payload(`c${n}`, 500))
            );

            const added = await Promise.all(paths.map((path) => frame.append({ parquet: path })));

            expect(added).toEqual(Array(8).fill(500));
            expect(await frame.size()).toBe(4000);
            expect((await frame.info()).appends).toEqual({ count: 8, rows: 4000 });

            await frame.destroy();
        });

        it('should keep records and Parquet appends isolated from each other', async () => {
            const frame = await DuckFrame.create(CONFIG, { name: 'accumulator_mixed' });

            const added = await Promise.all([
                frame.append({ parquet: await payload('mix1', 300) }),
                frame.append({ records: slice('mix2', 200) }),
                frame.append({ parquet: await payload('mix3', 100) }),
                frame.append({ records: slice('mix4', 400) }),
            ]);

            expect(added).toEqual([300, 200, 100, 400]);
            expect(await frame.size()).toBe(1000);

            await frame.destroy();
        });

        it('should not let one failing append harm the others running with it', async () => {
            const frame = await DuckFrame.create(CONFIG, { name: 'accumulator_conc_fail' });
            const good = await Promise.all(
                Array.from({ length: 4 }, (_unused, n) => payload(`ok${n}`, 250))
            );

            const results = await Promise.allSettled([
                ...good.map((path) => frame.append({ parquet: path })),
                frame.append({ parquet: join(tmpdir(), 'absent.parquet') }),
                frame.append({ records: [{ _key: 'bad', bytes: 'not-a-number' }] }),
            ]);

            expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(4);
            expect(results.filter((r) => r.status === 'rejected')).toHaveLength(2);
            // every good payload survived, and only those
            expect(await frame.size()).toBe(1000);
            expect((await frame.info()).appends).toEqual({ count: 4, rows: 1000 });

            await frame.destroy();
        });

        it('should promote a relation once, even when appends race', async () => {
            const relation = await DuckFrame.fromParquet(CONFIG, await payload('race', 100));

            const added = await Promise.all([
                relation.append({ parquet: await payload('race1', 50) }),
                relation.append({ parquet: await payload('race2', 50) }),
                relation.append({ parquet: await payload('race3', 50) }),
            ]);

            expect(added).toEqual([50, 50, 50]);
            expect(relation.isMaterialized).toBeTrue();
            // 100 promoted from the relation + 150 appended, all in ONE table
            expect(await relation.size()).toBe(250);

            await relation.destroy();
        });
    });

    describe('->info', () => {
        it('should report the state of a table frame, including its appends', async () => {
            const frame = await DuckFrame.create(CONFIG, { name: 'accumulator_info' });
            await frame.append({ parquet: await payload('q', 3) });
            await frame.append({ parquet: await payload('r', 2) });

            expect(await frame.info()).toEqual({
                name: expect.stringContaining('accumulator_info'),
                kind: 'table',
                isMaterialized: true,
                isOrdered: false,
                database: ':memory:',
                columns: ['_key', 'bytes', 'tags'],
                rows: 5,
                sql: expect.stringContaining('accumulator_info'),
                appends: { count: 2, rows: 5 },
            });

            await frame.destroy();
        });

        it('should report a relation as a relation, with the SQL that identifies it', async () => {
            const frame = await DuckFrame.create(CONFIG, { name: 'accumulator_info_rel' });
            await frame.append({ parquet: await payload('s', 4) });

            const derived = frame.filter('"bytes" > 0').orderBy(['bytes']);
            const info = await derived.info();

            expect(info.kind).toBe('relation');
            expect(info.name).toBeUndefined();
            expect(info.isMaterialized).toBeFalse();
            expect(info.isOrdered).toBeTrue();
            expect(info.rows).toBe(3);
            expect(info.sql).toInclude('ORDER BY');
            // a derived frame has had nothing appended to it
            expect(info.appends).toEqual({ count: 0, rows: 0 });

            await frame.destroy();
        });

        it('should not count a failed append', async () => {
            const frame = await DuckFrame.create(CONFIG, { name: 'accumulator_info_fail' });
            await frame.append({ records: slice('t', 2) });
            await expect(frame.append({ records: [{ _key: 'bad', bytes: 'nope' }] }))
                .rejects.toThrow(AppendError);

            expect((await frame.info()).appends).toEqual({ count: 1, rows: 2 });

            await frame.destroy();
        });
    });

    it('should accept records too, which is the api-server side of the same method', async () => {
        const frame = await DuckFrame.create(CONFIG, { name: 'accumulator_records' });

        expect(await frame.append({ records: slice('n', 3) })).toBe(3);
        expect(await frame.append({ records: slice('o', 2) })).toBe(2);
        expect(await frame.size()).toBe(5);

        await frame.destroy();
    });

    it('should reject an empty path list rather than building invalid SQL', async () => {
        const frame = await DuckFrame.create(CONFIG, { name: 'accumulator_none' });

        await expect(frame.append({ parquet: [] }))
            .rejects.toThrow('at least one Parquet path is required');

        await frame.destroy();
    });

    it('should raise loudly when a payload is missing', async () => {
        const frame = await DuckFrame.create(CONFIG, { name: 'accumulator_missing' });

        await expect(frame.append({ parquet: join(tmpdir(), 'does-not-exist.parquet') }))
            .rejects.toThrow(/No files found/);

        await frame.destroy();
    });
});

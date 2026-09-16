import 'jest-extended';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { FieldType } from '@terascope/types';
import { DataType, LATEST_VERSION } from '@terascope/data-types';
import { QueryAccess } from '../../src/query-access/index.js';
import { DuckTestDB } from './duckdb-helpers.js';

/**
 * The statement `restrictSQLQuery` builds, executed as it was handed over.
 *
 * `restrictSearchQuery` takes an `index` and a `size` and returns something
 * `client.search()` accepts unchanged; this is the same bargain in SQL, and these tests only
 * pass if the string needs nothing done to it.
*/
describe('sql statements (duckdb)', () => {
    const table = 'statement_test';
    let db: DuckTestDB;
    let tempDir: string;

    const dataType = new DataType({
        version: LATEST_VERSION,
        fields: {
            id: { type: FieldType.Keyword },
            bar: { type: FieldType.Keyword },
            secret: { type: FieldType.Keyword },
            num: { type: FieldType.Integer },
        }
    });

    const searchData = [
        { id: '1', bar: 'hello', secret: 's1', num: 10 },
        { id: '2', bar: 'hello', secret: 's2', num: 20 },
        { id: '3', bar: 'hello', secret: 's3', num: 30 },
        { id: '4', bar: 'other', secret: 's4', num: 40 },
    ];

    const access = new QueryAccess({
        allow_empty_queries: true,
        allow_implicit_queries: true,
        type_config: dataType.toXlucene(),
    });

    beforeAll(async () => {
        db = await DuckTestDB.create();
        await db.createTable(table, dataType, searchData);
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'xlucene-sql-'));
    });

    afterAll(async () => {
        await db.close();
        await fs.rm(tempDir, { recursive: true, force: true });
    });

    async function ids(sql: string): Promise<string[]> {
        const rows = await db.run(sql);
        return rows.map((row) => row.id as string);
    }

    describe('the table', () => {
        it('builds a statement that runs as-is', async () => {
            const sql = await access.restrictSQLQuery('bar:hello', { params: { table } });

            expect(sql).toEqual(`SELECT * FROM "${table}" WHERE ("bar" = 'hello')`);
            await expect(ids(sql)).resolves.toEqual(['1', '2', '3']);
        });

        /** `WHERE TRUE` is valid and says nothing, so a query that restricts nothing gets none. */
        it('leaves out the WHERE clause when the query matches everything', async () => {
            const sql = await access.restrictSQLQuery('', { params: { table } });

            expect(sql).toEqual(`SELECT * FROM "${table}"`);
            await expect(ids(sql)).resolves.toEqual(['1', '2', '3', '4']);
        });

        /**
         * A table name is quoted a segment at a time, so a reserved word is an ordinary name -
         * `order` and `group` are real table names and a parser error unquoted.
        */
        it('quotes a table whose name is a reserved word', async () => {
            await db.createTable('order', dataType, searchData.slice(0, 1));

            const sql = await access.restrictSQLQuery('bar:hello', { params: { table: 'order' } });

            expect(sql).toStartWith('SELECT * FROM "order"');
            await expect(ids(sql)).resolves.toEqual(['1']);
        });

        it('quotes each part of a qualified name', async () => {
            const sql = await access.restrictSQLQuery('*', { params: { table: 'main.events' } });

            expect(sql).toStartWith('SELECT * FROM "main"."events"');
        });
    });

    describe('the relation', () => {
        /**
         * **The duck-frame case.** The rows live in Parquet files rather than a table, and no
         * identifier can name them - so the source is an expression the caller writes and this
         * uses verbatim.
        */
        it('selects from a parquet file', async () => {
            const file = path.join(tempDir, 'rows.parquet');
            await db.run(`COPY "${table}" TO '${file}' (FORMAT parquet)`);

            const sql = await access.restrictSQLQuery('num:>=20', {
                params: { relation: `read_parquet('${file}')` }
            });

            expect(sql).toEqual(`SELECT * FROM read_parquet('${file}') WHERE ("num" >= 20)`);
            await expect(ids(sql)).resolves.toEqual(['2', '3', '4']);
        });

        it('refuses both a table and a relation', async () => {
            await expect(access.restrictSQLQuery('*', {
                params: { table, relation: 'something' }
            })).rejects.toThrow(/not both/);
        });

        it('refuses neither', async () => {
            await expect(access.restrictSQLQuery('*')).rejects.toThrow(/table or relation is required/);
        });
    });

    describe('paging', () => {
        it('applies size as a LIMIT', async () => {
            const sql = await access.restrictSQLQuery('bar:hello', { params: { table, size: 2 } });

            expect(sql).toEndWith('LIMIT 2');
            await expect(ids(sql)).resolves.toEqual(['1', '2']);
        });

        it('applies from as an OFFSET', async () => {
            const sql = await access.restrictSQLQuery('bar:hello', {
                params: { table, size: 2, from: 1 }
            });

            expect(sql).toEndWith('LIMIT 2 OFFSET 1');
            await expect(ids(sql)).resolves.toEqual(['2', '3']);
        });

        /**
         * A `LIMIT` cannot be parameterised, so the number is written into the statement -
         * which makes checking it the difference between a limit and an injection point.
        */
        it.each([
            ['a negative size', { size: -1 }],
            ['a fractional size', { size: 1.5 }],
            ['a non-numeric size', { size: '1; DROP TABLE users' as unknown as number }],
            ['a negative offset', { from: -10 }],
        ])('refuses %s', async (_name, params) => {
            await expect(access.restrictSQLQuery('*', { params: { table, ...params } }))
                .rejects.toThrow(/non-negative integer/);
        });
    });

    describe('ordering', () => {
        it('applies a sort from the params', async () => {
            const sql = await access.restrictSQLQuery('bar:hello', {
                params: { table, sort: [{ expression: '"num"', order: 'desc' }] }
            });

            expect(sql).toEndWith('ORDER BY "num" DESC');
            await expect(ids(sql)).resolves.toEqual(['3', '2', '1']);
        });

        /** The query's own ordering comes first, as the translated sort does for the DSL. */
        it('puts the query\'s own ordering before the caller\'s', async () => {
            const geoAccess = new QueryAccess({
                allow_empty_queries: true,
                allow_implicit_queries: true,
                default_geo_field: 'location',
                type_config: { ...dataType.toXlucene(), location: 'geo-point' as any },
            });

            const sql = await geoAccess.restrictSQLQuery('*', {
                params: { table, sort: [{ expression: '"num"', order: 'asc' }] },
                geo_sort_point: { lat: 10, lon: 10 },
            });

            expect(sql).toMatch(/ORDER BY ST_Distance_Sphere.+ ASC, "num" ASC$/);
        });
    });

    describe('field restrictions', () => {
        /**
         * The reason the statement is built here rather than by the caller: this is the piece
         * a caller composing `SELECT * FROM …` leaves out.
        */
        it('bakes an exclude into the projection', async () => {
            const restricted = new QueryAccess({
                excludes: ['secret'],
                allow_empty_queries: true,
                type_config: dataType.toXlucene(),
            });

            // the projection follows the type config's own field order

            const sql = await restricted.restrictSQLQuery('bar:hello', { params: { table } });

            expect(sql).toEqual(`SELECT "bar", "id", "num" FROM "${table}" WHERE ("bar" = 'hello')`);

            for (const row of await db.run(sql)) {
                expect(row).not.toContainKey('secret');
            }
        });

        it('takes the requested includes from the params', async () => {
            const sql = await access.restrictSQLQuery('bar:hello', {
                params: { table, includes: ['id'], size: 1 }
            });

            expect(sql).toEqual(`SELECT "id" FROM "${table}" WHERE ("bar" = 'hello') LIMIT 1`);
            await expect(db.run(sql)).resolves.toEqual([{ id: '1' }]);
        });

        it('returns rows with no data when nothing may be read', async () => {
            const restricted = new QueryAccess({
                includes: ['id', 'bar'],
                allow_empty_queries: true,
                allow_implicit_queries: true,
                type_config: dataType.toXlucene(),
            });

            const sql = await restricted.restrictSQLQuery('bar:hello', {
                params: { table, includes: ['secret'] }
            });

            expect(sql).toStartWith('SELECT NULL FROM');
            await expect(db.run(sql)).resolves.toBeArrayOfSize(3);
        });
    });
});

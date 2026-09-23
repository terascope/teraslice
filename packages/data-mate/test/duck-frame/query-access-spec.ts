import 'jest-extended';
import { DataTypeConfig, FieldType } from '@terascope/types';
import { DataType, LATEST_VERSION } from '@terascope/data-types';
import { QueryAccess } from 'xlucene-translator';
import { DuckFrame, closeDuckDatabase } from '../../src/duck-frame/index.js';

/**
 * **A `QueryAccess` statement, RUN on a frame.**
 *
 * This is the shape spaces actually has: every query and execution plan is driven by
 * `QueryAccess`, which hands back a complete statement with the field restrictions already
 * applied, and the frame's job is to execute it rather than to rebuild it from parts. So
 * these tests assert on the ROWS, not on the SQL - a restriction that is reported beside the
 * output is not a restriction, and only running it can tell the difference.
*/
describe('DuckFrame with QueryAccess', () => {
    /**
     * ONE config, read two ways: the frame builds its table from the DataType config and
     * `QueryAccess` parses the same fields from the xLucene one. Deriving both from a single
     * declaration is the point - two hand-written configs are two things to drift.
    */
    const config: DataTypeConfig = {
        version: LATEST_VERSION,
        fields: {
            _key: { type: FieldType.Keyword },
            bar: { type: FieldType.Keyword },
            secret: { type: FieldType.Keyword },
            num: { type: FieldType.Integer },
        }
    };

    const typeConfig = new DataType(config).toXlucene();

    const records = [
        { _key: 'a', bar: 'hello', secret: 's1', num: 10 },
        { _key: 'b', bar: 'hello', secret: 's2', num: 30 },
        { _key: 'c', bar: 'other', secret: 's3', num: 20 },
        { _key: 'd', bar: 'other', secret: 's4', num: null },
    ];

    let frame: DuckFrame;

    beforeAll(async () => {
        frame = await DuckFrame.fromRecords(config, records, { name: 'access' });
    });

    afterAll(async () => {
        await frame.destroy();
        await closeDuckDatabase();
    });

    async function collect(f: DuckFrame): Promise<Record<string, unknown>[]> {
        const out: Record<string, unknown>[] = [];
        for await (const row of f.rows()) out.push(row);
        return out;
    }

    /**
     * The whole composition, in the order a caller writes it: the frame names itself, the
     * statement is built around that name, and the frame runs it.
    */
    it('should run a restricted statement end to end', async () => {
        const access = new QueryAccess({ type_config: typeConfig });
        const sql = await access.restrictSQLQuery('bar:hello', {
            params: frame.searchParams()
        });

        const rows = await collect(frame.query(sql));

        expect(rows).toHaveLength(2);
        expect(rows.map((row) => row._key)).toEqual(['a', 'b']);
    });

    /**
     * **The restriction has to reach the rows.** `excludes` becomes a projection, and a
     * caller that used `where` and ignored `select` would return the excluded column - which
     * is why the statement is what the frame executes.
    */
    it('should withhold an excluded column from the rows themselves', async () => {
        const access = new QueryAccess({ type_config: typeConfig, excludes: ['secret'] });
        const sql = await access.restrictSQLQuery('bar:hello', {
            params: frame.searchParams()
        });

        const rows = await collect(frame.query(sql));

        expect(rows).toHaveLength(2);
        for (const row of rows) {
            expect(row).not.toContainKey('secret');
            expect(row).toContainKeys(['_key', 'bar', 'num']);
        }
    });

    it('should page through the statement, not in JavaScript', async () => {
        const access = new QueryAccess({
            type_config: typeConfig, allow_implicit_queries: true
        });
        const sql = await access.restrictSQLQuery('*', {
            params: { ...frame.searchParams(2, 1), sort: [{ expression: '"_key"', order: 'asc' }] }
        });

        expect(sql).toInclude('LIMIT 2');
        expect(sql).toInclude('OFFSET 1');
        expect((await collect(frame.query(sql))).map((row) => row._key)).toEqual(['b', 'c']);
    });

    /**
     * **The reason the clause builder is shared.** A sort that went through `QueryAccess` and
     * the same sort built by `frame.orderBy` used to place nulls at opposite ends of an
     * ascending page - the translator left DuckDB's `NULLS LAST` default standing, the frame
     * emitted `DataFrame`'s rule. Now one builder renders both.
    */
    describe('null placement', () => {
        it('should agree between a translated statement and the frame\'s own orderBy', async () => {
            const access = new QueryAccess({
                type_config: typeConfig, allow_implicit_queries: true
            });
            const sql = await access.restrictSQLQuery('*', {
                params: {
                    ...frame.searchParams(),
                    sort: [{ expression: '"num"', order: 'asc' }]
                }
            });

            const translated = await collect(frame.query(sql));
            const own = await collect(frame.orderBy([{ expression: '"num"' }]));

            expect(translated.map((row) => row._key)).toEqual(own.map((row) => row._key));
        });

        it('should put a null first ascending, which is DataFrame\'s rule', async () => {
            const access = new QueryAccess({
                type_config: typeConfig, allow_implicit_queries: true
            });
            const sql = await access.restrictSQLQuery('*', {
                params: {
                    ...frame.searchParams(),
                    sort: [{ expression: '"num"', order: 'asc' }]
                }
            });

            expect(sql).toInclude('ASC NULLS FIRST');
            expect((await collect(frame.query(sql))).map((row) => row._key))
                .toEqual(['d', 'a', 'c', 'b']);
        });

        it('should let a caller ask for the Elasticsearch answer instead', async () => {
            const access = new QueryAccess({
                type_config: typeConfig, allow_implicit_queries: true
            });
            const sql = await access.restrictSQLQuery('*', {
                params: {
                    ...frame.searchParams(),
                    sort: [{ expression: '"num"', order: 'asc', nulls: 'last' }]
                }
            });

            expect((await collect(frame.query(sql))).map((row) => row._key))
                .toEqual(['a', 'c', 'b', 'd']);
        });
    });

    /**
     * The other half of the API: `restrictSQLParts` for a caller composing its own statement.
     *
     * **Its `select` is a pre-joined string and cannot be turned back into a map** - the
     * DuckDB dialect rebuilds a partly-readable STRUCT with `struct_pack`, so the projection
     * and `columns` are deliberately not one-to-one. Rebuilding from `columns` would drop the
     * restriction, which is why `select` takes a verbatim list.
    */
    describe('->restrictSQLParts', () => {
        it('should take the projection verbatim, restriction and all', async () => {
            const access = new QueryAccess({ type_config: typeConfig, excludes: ['secret'] });
            const parts = await access.restrictSQLParts('bar:hello');

            const projected = frame
                .filter(parts.where)
                .select(parts.select, { columns: parts.columns });

            const rows = await collect(projected);

            expect(rows).toHaveLength(2);
            for (const row of rows) expect(row).not.toContainKey('secret');
        });

        it('should refuse a verbatim list with no columns, rather than guess them', () => {
            expect(() => frame.select('"bar", "num"'))
                .toThrow('a verbatim SELECT list needs its `columns`');
        });

        it('should still take a map, which supplies its own names', async () => {
            const doubled = frame.select(
                { _key: '"_key"', twice: '"num" * 2' },
                {
                    config: {
                        version: LATEST_VERSION,
                        fields: {
                            _key: { type: FieldType.Keyword },
                            twice: { type: FieldType.Integer },
                        }
                    }
                }
            );

            expect(doubled.columns).toEqual(['_key', 'twice']);
            expect((await collect(doubled)).map((row) => row.twice))
                .toEqual([20, 60, 40, null]);
        });
    });

    /**
     * Two generated statements, joined. Each becomes a frame, and `join` composes them -
     * there is no separate concept for "combine two statements".
    */
    it('should join two generated statements', async () => {
        const access = new QueryAccess({ type_config: typeConfig });
        const params = frame.searchParams();

        const left = frame.query(await access.restrictSQLQuery('bar:hello', { params }));
        const right = frame.query(await access.restrictSQLQuery('num:>=20', { params }));

        const joined = left.join(right, {
            on: 'a."_key" = b."_key"',
            select: { key: 'a."_key"', bar: 'a."bar"', total: 'b."num"' },
            config: {
                version: LATEST_VERSION,
                fields: {
                    key: { type: FieldType.Keyword },
                    bar: { type: FieldType.Keyword },
                    total: { type: FieldType.Integer },
                }
            },
        });

        expect(await collect(joined)).toEqual([{ key: 'b', bar: 'hello', total: 30 }]);
    });

    /**
     * **A statement that names its source twice wants a TABLE.** A relation is textual, so
     * each mention re-executes the subquery; a table name is evaluated once however often it
     * appears. `searchParams` reports whichever the frame has.
    */
    describe('->searchParams', () => {
        it('should report a table by name, so a repeated reference costs nothing', () => {
            expect(frame.searchParams()).toEqual({ table: frame.table });
        });

        it('should report a relation as SQL, used verbatim', () => {
            const derived = frame.filter('"num" > 5');

            expect(derived.searchParams()).toEqual({ relation: derived.from });
        });

        it('should carry the paging bounds when they are given', () => {
            expect(frame.searchParams(10, 5))
                .toEqual({ table: frame.table, size: 10, from: 5 });
        });

        it('should name one source for a statement that references it twice', async () => {
            const access = new QueryAccess({
                type_config: typeConfig, allow_implicit_queries: true
            });
            const sql = await access.restrictSQLQuery('*', { params: frame.searchParams() });

            const selfJoined = `SELECT a."_key" FROM (${sql}) AS a`
                + ` JOIN (${sql}) AS b ON a."_key" = b."_key" ORDER BY a."_key" ASC`;

            expect((await collect(frame.query(selfJoined, config, ['_key'])))
                .map((row) => row._key)).toEqual(['a', 'b', 'c', 'd']);
        });
    });
});

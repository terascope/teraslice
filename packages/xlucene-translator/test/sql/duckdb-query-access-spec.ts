import 'jest-extended';
import { FieldType } from '@terascope/types';
import { DataType, LATEST_VERSION } from '@terascope/data-types';
import { QueryAccess, QueryAccessConfig } from '../../src/index.js';
import { DuckTestDB } from './duckdb-helpers.js';

/**
 * Every `QueryAccess` option on the SQL path.
 *
 * Some options refuse a query and some change it. The ones that change it are checked by
 * running the statement and inspecting the rows, because a restriction that is only reported
 * alongside the result is not applied.
*/
describe('query access options (duckdb)', () => {
    const table = 'access_test';
    let db: DuckTestDB;

    const dataType = new DataType({
        version: LATEST_VERSION,
        fields: {
            id: { type: FieldType.Keyword },
            bar: { type: FieldType.Keyword },
            secret: { type: FieldType.Keyword },
            num: { type: FieldType.Integer },
            nested: { type: FieldType.Object },
            'nested.name': { type: FieldType.Keyword },
            'nested.secret': { type: FieldType.Keyword },
        }
    });

    const typeConfig = dataType.toXlucene();

    const searchData = [
        {
            id: '1', bar: 'hello', secret: 's1', num: 10, nested: { name: 'n1', secret: 'x1' }
        },
        {
            id: '2', bar: 'hello', secret: 's2', num: 20, nested: { name: 'n2', secret: 'x2' }
        },
        {
            id: '3', bar: 'other', secret: 's3', num: 30, nested: { name: 'n3', secret: 'x3' }
        },
        {
            id: '4', bar: 'other', secret: 's4', num: 40, nested: { name: 'n4', secret: 'x4' }
        },
    ];

    beforeAll(async () => {
        db = await DuckTestDB.create();
        await db.createTable(table, dataType, searchData);
    });

    afterAll(async () => {
        await db.close();
    });

    function accessWith(config: QueryAccessConfig<any>): QueryAccess<any> {
        return new QueryAccess({ type_config: typeConfig, ...config });
    }

    async function idsFor(
        access: QueryAccess<any>, query: string, opts: Record<string, any> = {}
    ): Promise<string[]> {
        const sql = await access.restrictSQLQuery(query, { ...opts, params: { table } });
        const rows = await db.run(sql);
        return rows.map((row) => row.id as string);
    }

    /**
     * A constraint is AND-ed onto every query, including an empty one, which makes it a
     * security control and not just a default filter.
    */
    describe('a constraint', () => {
        it('narrows a query that was asked', async () => {
            const access = accessWith({ constraint: 'bar:hello' });

            await expect(idsFor(access, 'num:>=10')).resolves.toEqual(['1', '2']);
        });

        it('answers an empty query on its own', async () => {
            const access = accessWith({ constraint: 'bar:hello' });

            await expect(idsFor(access, '')).resolves.toEqual(['1', '2']);
        });

        /** Several constraints all apply, and a caller cannot satisfy one to escape another. */
        it('applies every constraint when given a list', async () => {
            const access = accessWith({
                constraint: ['bar:hello', 'num:>=20'],
                allow_implicit_queries: true,
            });

            await expect(idsFor(access, '*')).resolves.toEqual(['2']);
            await expect(idsFor(access, 'num:10')).resolves.toEqual([]);
        });
    });

    /** It defaults to `true`, so an empty query is answered unless it is turned off. */
    describe('allow_empty_queries', () => {
        it('refuses an empty query when it is off', async () => {
            const access = accessWith({ allow_empty_queries: false });

            await expect(access.restrictSQLQuery('', { params: { table } }))
                .rejects.toThrow(/Empty queries are restricted/);
        });

        it('answers one by default', async () => {
            const access = accessWith({});

            await expect(idsFor(access, '')).resolves.toEqual(['1', '2', '3', '4']);
        });
    });

    describe('allow_implicit_queries', () => {
        it('refuses a query with no field when it is not set', async () => {
            const access = accessWith({});

            await expect(access.restrictSQLQuery('hello', { params: { table } }))
                .rejects.toThrow(/Implicit fields are restricted/);
        });

        it('answers one when it is', async () => {
            const access = accessWith({ allow_implicit_queries: true });

            await expect(idsFor(access, 'hello')).resolves.toEqual(['1', '2']);
        });
    });

    /**
     * A leading wildcard must read every term in the field, and the regular expressions
     * refused here can match the empty string. Both read the whole index while looking like a
     * filter.
    */
    describe('prevent_prefix_wildcard', () => {
        const access = accessWith({ prevent_prefix_wildcard: true });

        it.each([
            ['a leading *', 'bar:*ello'],
            ['a leading ?', 'bar:?ello'],
            ['a regular expression with a leading .*', 'bar:/.*ello/'],
            ['a regular expression with a leading .?', 'bar:/.?ello/'],
        ])('refuses %s', async (_name, query) => {
            await expect(access.restrictSQLQuery(query, { params: { table } })).toReject();
        });

        /**
         * `h*` and `h{0,1}` can both match the empty string, so neither requires the `h` and
         * both read the whole index like a leading wildcard. `hel*` requires its prefix and is
         * allowed.
        */
        it.each([
            ['a quantifier that can match nothing', 'bar:/h*/'],
            ['an interval starting at zero', 'bar:/h{0,1}/'],
        ])('refuses a regular expression with %s', async (_name, query) => {
            await expect(access.restrictSQLQuery(query, { params: { table } }))
                .rejects.toThrow(/non-guaranteed matches/);
        });

        it('allows a quantifier that still requires its prefix', async () => {
            await expect(idsFor(access, 'bar:/hel*o/')).resolves.toEqual(['1', '2']);
        });

        it('allows a trailing wildcard, which is a prefix search', async () => {
            await expect(idsFor(access, 'bar:hel*')).resolves.toEqual(['1', '2']);
        });
    });

    /**
     * A restricted field is refused in the query, not just withheld from the result.
     *
     * Otherwise it would leak: `secret:s1` returning one row and `secret:s2` returning another
     * tells a caller both values without either being projected.
    */
    describe('field restrictions on the query', () => {
        it('refuses an excluded field', async () => {
            const access = accessWith({ excludes: ['secret'] });

            await expect(access.restrictSQLQuery('secret:s1', { params: { table } }))
                .rejects.toThrow(/restricted/);
        });

        it('refuses a field the includes do not list', async () => {
            const access = accessWith({ includes: ['id', 'bar'] });

            await expect(access.restrictSQLQuery('secret:s1', { params: { table } }))
                .rejects.toThrow(/restricted/);
            await expect(idsFor(access, 'bar:hello')).resolves.toEqual(['1', '2']);
        });

        /**
         * A field missing from the type config is restricted too. SQL has no unmapped fields,
         * so an undeclared name would reach the engine as a column and fail the whole query
         * instead of matching nothing as Elasticsearch does. `QueryAccess` refuses it first.
        */
        it('refuses a field the type config does not declare', async () => {
            const access = accessWith({});

            await expect(access.restrictSQLQuery('nope:hello', { params: { table } }))
                .rejects.toThrow(/Field nope in query is restricted/);
        });

        it('refuses an excluded member of an object without refusing its siblings', async () => {
            const access = accessWith({ excludes: ['nested.secret'] });

            await expect(access.restrictSQLQuery('nested.secret:x1', { params: { table } }))
                .rejects.toThrow(/restricted/);
            await expect(idsFor(access, 'nested.name:n1')).resolves.toEqual(['1']);
        });

        /**
         * The projection is the only place SQL can withhold a field, so a partly readable
         * object is rebuilt. Dropping the column would also withhold the readable member, and
         * selecting it whole would leak the excluded one.
        */
        it('rebuilds an object that is only partly readable', async () => {
            const access = accessWith({ excludes: ['nested.secret'] });

            const sql = await access.restrictSQLQuery('bar:hello', { params: { table } });
            const rows = await db.run(sql);

            expect(rows).toBeArrayOfSize(2);
            for (const row of rows) {
                expect(row.nested).toContainKey('name');
                expect(row.nested).not.toContainKey('secret');
            }
        });
    });

    /**
     * The statement's parts, for a caller that already has a relation. `where` on its own
     * must select the same rows as the whole statement.
    */
    describe('restrictSQLParts', () => {
        it('hands back a where a caller can run, and the projection that goes with it', async () => {
            const access = accessWith({ excludes: ['secret'] });

            const {
                where, select, columns, excludes
            } = await access.restrictSQLParts('bar:hello');

            expect(where).toEqual('("bar" = \'hello\')');
            expect(select).not.toInclude('secret');
            expect(columns).not.toContain('secret');
            expect(excludes).toEqual(['secret']);

            const rows = await db.run(`SELECT ${select} FROM "${table}" WHERE ${where}`);

            expect(rows.map((row) => row.id)).toEqual(['1', '2']);
            for (const row of rows) expect(row).not.toContainKey('secret');
        });

        it('carries the requested includes through as well', async () => {
            const access = accessWith({});

            const { select, columns, includes } = await access.restrictSQLParts('bar:hello', {
                params: { includes: ['id', 'bar'] }
            });

            // the projection follows the type config's field order, not the request's
            expect(select).toEqual('"bar", "id"');
            expect(columns).toEqual(['bar', 'id']);
            expect(includes).toEqual(['id', 'bar']);
        });
    });

    /**
     * `QueryAccess` caches the parse and translation by query text, so after the cache is
     * cleared it must rebuild them.
    */
    it('keeps answering the same way after its cache is cleared', async () => {
        const access = accessWith({});

        await expect(idsFor(access, 'bar:hello')).resolves.toEqual(['1', '2']);

        access.clearCache();

        await expect(idsFor(access, 'bar:hello')).resolves.toEqual(['1', '2']);
    });
});

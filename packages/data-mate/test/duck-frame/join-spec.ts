import 'jest-extended';
import { FieldType, DataTypeConfig } from '@terascope/types';
import { DuckFrame, closeDuckDatabase } from '../../src/duck-frame/DuckFrame.js';

const PARENT: DataTypeConfig = {
    version: 1,
    fields: {
        pkey: { type: FieldType.Keyword },
        pname: { type: FieldType.Keyword },
        bytes: { type: FieldType.Integer },
    },
};

const CHILD: DataTypeConfig = {
    version: 1,
    fields: {
        ckey: { type: FieldType.Keyword },
        cname: { type: FieldType.Keyword },
        score: { type: FieldType.Float },
    },
};

const PARENTS = [
    { pkey: 'a', pname: 'alpha', bytes: 10 },
    { pkey: 'b', pname: 'beta', bytes: 20 },
    { pkey: 'c', pname: 'gamma', bytes: 30 },
];

const CHILDREN = [
    { ckey: 'a', cname: 'a1', score: 1 },
    { ckey: 'a', cname: 'a2', score: 2 },
    { ckey: 'b', cname: 'b1', score: 3 },
];

async function collect(frame: DuckFrame): Promise<Record<string, unknown>[]> {
    const out: Record<string, unknown>[] = [];
    for await (const row of frame.rows()) out.push(row);
    return out;
}

describe('DuckFrame.join', () => {
    let parent: DuckFrame;
    let child: DuckFrame;

    beforeAll(async () => {
        parent = await DuckFrame.fromRecords(PARENT, PARENTS, { name: 'parent' });
        child = await DuckFrame.fromRecords(CHILD, CHILDREN, { name: 'child' });
    });

    afterAll(async () => {
        await parent.destroy();
        await child.destroy();
        await closeDuckDatabase();
    });

    const JOINED: DataTypeConfig = {
        version: 1,
        fields: {
            pkey: { type: FieldType.Keyword },
            pname: { type: FieldType.Keyword },
            cname: { type: FieldType.Keyword },
        },
    };

    it('is a flat inner join by default', async () => {
        const joined = parent.join(child, {
            on: 'a.pkey = b.ckey',
            select: { pkey: 'a.pkey', pname: 'a.pname', cname: 'b.cname' },
            config: JOINED,
        });

        const rows = (await collect(joined))
            .sort((x, y) => String(x.cname).localeCompare(String(y.cname)));

        expect(rows).toEqual([
            { pkey: 'a', pname: 'alpha', cname: 'a1' },
            { pkey: 'a', pname: 'alpha', cname: 'a2' },
            { pkey: 'b', pname: 'beta', cname: 'b1' },
        ]);
    });

    it('keeps unmatched parents on a left join', async () => {
        const joined = parent.join(child, {
            type: 'left',
            on: 'a.pkey = b.ckey',
            select: { pkey: 'a.pkey', pname: 'a.pname', cname: 'b.cname' },
            config: JOINED,
        });

        const rows = await collect(joined);
        expect(rows).toHaveLength(4);
        expect(rows.find((r) => r.pkey === 'c')).toMatchObject({ pkey: 'c', cname: null });
    });

    it('returns a relation, so it composes with filter and select', async () => {
        const joined = parent.join(child, {
            on: 'a.pkey = b.ckey',
            select: { pkey: 'a.pkey', pname: 'a.pname', cname: 'b.cname' },
            config: JOINED,
        });

        expect(joined.isMaterialized).toBeFalse();
        expect(await collect(joined.filter('cname = \'b1\''))).toHaveLength(1);
    });

    it('joins a relation to a relation, not just table to table', async () => {
        const bigParents = parent.filter('bytes > 10');
        const joined = bigParents.join(child, {
            on: 'a.pkey = b.ckey',
            select: { pkey: 'a.pkey', pname: 'a.pname', cname: 'b.cname' },
            config: JOINED,
        });

        expect(await collect(joined)).toEqual([
            { pkey: 'b', pname: 'beta', cname: 'b1' }
        ]);
    });

    it('lets the aliases be renamed', async () => {
        const joined = parent.join(child, {
            as: 'p',
            otherAs: 'c',
            on: 'p.pkey = c.ckey',
            select: { pkey: 'p.pkey', pname: 'p.pname', cname: 'c.cname' },
            config: JOINED,
        });
        expect(await collect(joined)).toHaveLength(3);
    });

    it('aggregates over the join, which is where fetch/agg semantics land', async () => {
        const counted = parent.join(child, {
            type: 'left',
            on: 'a.pkey = b.ckey',
            select: { pkey: 'a.pkey', kids: 'count(b.cname)' },
            groupBy: ['a.pkey'],
            config: {
                version: 1,
                fields: {
                    pkey: { type: FieldType.Keyword },
                    kids: { type: FieldType.Integer },
                },
            },
        });

        const rows = (await collect(counted))
            .sort((x, y) => String(x.pkey).localeCompare(String(y.pkey)));
        expect(rows).toEqual([
            { pkey: 'a', kids: 2 },
            { pkey: 'b', kids: 1 },
            { pkey: 'c', kids: 0 },
        ]);
    });

    it('refuses to join frames from different databases', async () => {
        const other = await DuckFrame.fromRecords(
            CHILD, CHILDREN, { database: ':memory:', name: 'elsewhere' }
        );
        // same default database here, so build a genuinely separate one
        await other.destroy();

        const separate = await DuckFrame.fromRecords(
            CHILD, CHILDREN, { database: '/tmp/duck-join-spec.db', name: 'separate' }
        );

        expect(() => parent.join(separate, {
            on: 'a.pkey = b.ckey',
            select: { pkey: 'a.pkey' },
            config: { version: 1, fields: { pkey: { type: FieldType.Keyword } } },
        })).toThrow(/different databases/);

        await closeDuckDatabase('/tmp/duck-join-spec.db');
    });

    it('chains to three and four levels by nesting relations', async () => {
        // Each join returns a relation, so the next join takes it as its left side. The
        // previous join is aliased as `a`, and you can only reference columns it SELECTED -
        // so a column needed at level 4 must be projected through every level.
        const grand = await DuckFrame.fromRecords({
            version: 1,
            fields: { gkey: { type: FieldType.Keyword }, gname: { type: FieldType.Keyword } },
        }, [{ gkey: 'a1', gname: 'g-one' }, { gkey: 'b1', gname: 'g-two' }], { name: 'grand' });

        const great = await DuckFrame.fromRecords({
            version: 1,
            fields: { xkey: { type: FieldType.Keyword }, xname: { type: FieldType.Keyword } },
        }, [{ xkey: 'g-one', xname: 'deep' }], { name: 'great' });

        const level2 = parent.join(child, {
            on: 'a.pkey = b.ckey',
            // cname carried forward so level 3 can join on it
            select: { pkey: 'a.pkey', cname: 'b.cname' },
            config: {
                version: 1,
                fields: {
                    pkey: { type: FieldType.Keyword }, cname: { type: FieldType.Keyword },
                },
            },
        });

        const level3 = level2.join(grand, {
            on: 'a.cname = b.gkey',
            select: { pkey: 'a.pkey', cname: 'a.cname', gname: 'b.gname' },
            config: {
                version: 1,
                fields: {
                    pkey: { type: FieldType.Keyword },
                    cname: { type: FieldType.Keyword },
                    gname: { type: FieldType.Keyword },
                },
            },
        });

        const l3 = (await collect(level3))
            .sort((x, y) => String(x.pkey).localeCompare(String(y.pkey)));
        expect(l3).toEqual([
            { pkey: 'a', cname: 'a1', gname: 'g-one' },
            { pkey: 'b', cname: 'b1', gname: 'g-two' },
        ]);

        const level4 = level3.join(great, {
            on: 'a.gname = b.xkey',
            select: { pkey: 'a.pkey', gname: 'a.gname', xname: 'b.xname' },
            config: {
                version: 1,
                fields: {
                    pkey: { type: FieldType.Keyword },
                    gname: { type: FieldType.Keyword },
                    xname: { type: FieldType.Keyword },
                },
            },
        });

        expect(await collect(level4)).toEqual([
            { pkey: 'a', gname: 'g-one', xname: 'deep' },
        ]);

        // still one statement - the optimiser sees the whole thing, not four round trips
        expect(level4.isMaterialized).toBeFalse();

        await grand.destroy();
        await great.destroy();
    });

    it('requires at least one selected expression', () => {
        expect(() => parent.join(child, {
            on: 'a.pkey = b.ckey',
            select: {},
            config: JOINED,
        })).toThrow(/at least one expression/);
    });
});

describe('DuckFrame.select with groupBy', () => {
    let frame: DuckFrame;

    beforeAll(async () => {
        frame = await DuckFrame.fromRecords(PARENT, [
            { pkey: 'a', pname: 'x', bytes: 10 },
            { pkey: 'a', pname: 'y', bytes: 20 },
            { pkey: 'b', pname: 'z', bytes: 30 },
        ], { name: 'grouped' });
    });

    afterAll(async () => {
        await frame.destroy();
        await closeDuckDatabase();
    });

    const AGG: DataTypeConfig = {
        version: 1,
        fields: {
            pkey: { type: FieldType.Keyword },
            total: { type: FieldType.Long },
        },
    };

    it('appends GROUP BY to the projection it already builds', async () => {
        const rows = (await collect(frame.select(
            { pkey: 'pkey', total: 'CAST(sum(bytes) AS HUGEINT)' }, AGG, ['pkey']
        ))).sort((a, b) => String(a.pkey).localeCompare(String(b.pkey)));

        expect(rows).toEqual([
            { pkey: 'a', total: 30 },
            { pkey: 'b', total: 30 },
        ]);
    });

    it('aggregates globally with no groupBy, which select already did', async () => {
        expect(await collect(frame.select(
            { total: 'CAST(sum(bytes) AS HUGEINT)' },
            { version: 1, fields: { total: { type: FieldType.Long } } }
        ))).toEqual([{ total: 60 }]);
    });

    it('groups by an expression, not just a field', async () => {
        const rows = await collect(frame.select(
            { half: 'bytes >= 20', total: 'CAST(sum(bytes) AS HUGEINT)' },
            {
                version: 1,
                fields: {
                    half: { type: FieldType.Boolean },
                    total: { type: FieldType.Long },
                },
            },
            ['bytes >= 20']
        ));
        expect(rows).toHaveLength(2);
    });

    it('composes with filter as HAVING does', async () => {
        const agg = frame.select(
            { pkey: 'pkey', total: 'CAST(sum(bytes) AS HUGEINT)' }, AGG, ['pkey']
        );
        expect(await collect(agg.filter('total > 30'))).toEqual([]);
        expect(await collect(agg.filter('total >= 30'))).toHaveLength(2);
    });
});

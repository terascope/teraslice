import 'jest-extended';
import { FieldType, DataTypeConfig } from '@terascope/types';
import { TealFrame, closeDuckDatabase } from '../../src/index.js';

const LEFT: DataTypeConfig = {
    version: 1,
    fields: {
        id: { type: FieldType.Keyword },
        name: { type: FieldType.Keyword },
    },
};

const RIGHT: DataTypeConfig = {
    version: 1,
    fields: {
        score: { type: FieldType.Integer },
        id: { type: FieldType.Keyword },
    },
};

async function collect(frame: TealFrame): Promise<Record<string, unknown>[]> {
    const out: Record<string, unknown>[] = [];
    for await (const row of frame.rows()) out.push(row);
    return out;
}

function byId(rows: Record<string, unknown>[]): Record<string, unknown>[] {
    return [...rows].sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

describe('TealFrame.union', () => {
    let left: TealFrame;
    let right: TealFrame;

    beforeAll(async () => {
        left = await TealFrame.fromRecords(LEFT, [
            { id: 'a', name: 'alpha' },
            { id: 'b', name: 'beta' },
        ], { name: 'union_left' });
        right = await TealFrame.fromRecords(RIGHT, [
            { id: 'c', score: 3 },
        ], { name: 'union_right' });
    });

    afterAll(async () => {
        await left.destroy();
        await right.destroy();
        await closeDuckDatabase();
    });

    it('keeps every row of every frame, duplicates too', async () => {
        const unioned = left.union([left]);

        expect(await unioned.size()).toBe(4);
        expect(unioned.columns).toEqual(['id', 'name']);
    });

    it('matches the columns by name, a column a frame does not have is null', async () => {
        const unioned = left.union([right]);

        expect(unioned.columns).toEqual(['id', 'name', 'score']);
        expect(Object.keys(unioned.config.fields)).toEqual(['id', 'name', 'score']);
        expect(byId(await collect(unioned))).toEqual([
            { id: 'a', name: 'alpha', score: null },
            { id: 'b', name: 'beta', score: null },
            { id: 'c', name: null, score: 3 },
        ]);
    });

    it('composes with the other operations, so many filtered frames are one statement', async () => {
        const config: DataTypeConfig = {
            version: 1,
            fields: { id: { type: FieldType.Keyword }, key: { type: FieldType.Integer } },
        };
        const keyed = (id: string, key: number) => left.filter(`"id" = '${id}'`)
            .select({ id: '"id"', key: `${key}` }, { config });
        const unioned = keyed('a', 1).union([keyed('b', 2)]);

        expect(byId(await collect(unioned.filter('"key" = 2')))).toEqual([{ id: 'b', key: 2 }]);
    });

    it('takes the config of the result when the caller knows it', async () => {
        const config: DataTypeConfig = {
            version: 1,
            fields: { id: { type: FieldType.Keyword }, name: { type: FieldType.Text } },
        };

        expect(left.union([left], { config }).config).toBe(config);
    });

    it('requires another frame, from the same database, that is not ordered', async () => {
        expect(() => left.union([])).toThrow('union requires at least one other frame');
        expect(() => left.orderBy([{ expression: '"id"' }]).union([left]))
            .toThrow('union reorders rows');

        // the default database is shared, so a separate one is a file
        const separate = await TealFrame.fromRecords(
            LEFT, [], { database: '/tmp/duck-union-spec.db', name: 'separate' }
        );
        expect(() => left.union([separate])).toThrow('union requires every frame to be in the same database');
        await closeDuckDatabase('/tmp/duck-union-spec.db');
    });
});

import 'jest-extended';
import { FieldType, DataTypeConfig } from '@terascope/types';
import { TealFrame, closeDuckDatabase } from '../../src/index.js';

const CONFIG: DataTypeConfig = {
    version: 1,
    fields: {
        key: { type: FieldType.Keyword },
        name: { type: FieldType.Keyword },
        position: { type: FieldType.Integer },
    },
};

const RECORDS = [
    { key: 'a', name: 'a3', position: 3 },
    { key: 'a', name: 'a1', position: 1 },
    { key: 'a', name: 'a2', position: 2 },
    { key: 'b', name: 'b1', position: 1 },
    { key: null, name: 'n1', position: 1 },
    { key: null, name: 'n2', position: 2 },
];

async function names(frame: TealFrame): Promise<string[]> {
    const out: string[] = [];
    for await (const row of frame.rows()) out.push(row.name as string);
    return out.sort();
}

describe('TealFrame.limitPerGroup', () => {
    let frame: TealFrame;

    beforeAll(async () => {
        frame = await TealFrame.fromRecords(CONFIG, RECORDS, { name: 'limit_per_group' });
    });

    afterAll(async () => {
        await frame.destroy();
        await closeDuckDatabase();
    });

    it('keeps the first rows of each group in the order, null is a group too', async () => {
        const limited = frame.limitPerGroup(2, {
            groupBy: ['"key"'],
            orderBy: [{ expression: '"position"' }],
        });

        await expect(names(limited)).resolves.toEqual(['a1', 'a2', 'b1', 'n1', 'n2']);
    });

    it('follows the order\'s direction', async () => {
        const limited = frame.limitPerGroup(1, {
            groupBy: ['"key"'],
            orderBy: [{ expression: '"position"', order: 'desc' }],
        });

        await expect(names(limited)).resolves.toEqual(['a3', 'b1', 'n2']);
    });

    it('is one group without groupBy', async () => {
        const limited = frame.limitPerGroup(2, {
            groupBy: [],
            orderBy: [{ expression: '"position"' }, { expression: '"name"' }],
        });

        await expect(names(limited)).resolves.toEqual(['a1', 'b1']);
    });

    it('keeps no rows for a count of zero, and composes with the other operations', async () => {
        const options = { groupBy: ['"key"'], orderBy: [{ expression: '"position"' }] };

        await expect(frame.limitPerGroup(0, options).size()).resolves.toBe(0);
        await expect(names(frame.filter('"key" = \'a\'').limitPerGroup(1, options)))
            .resolves.toEqual(['a1']);
    });

    it('requires a whole count and an order, and a frame that is not ordered', () => {
        const options = { groupBy: ['"key"'], orderBy: [{ expression: '"position"' }] };

        expect(() => frame.limitPerGroup(-1, options)).toThrow('limitPerGroup\'s count');
        expect(() => frame.limitPerGroup(1.5, options)).toThrow('limitPerGroup\'s count');
        expect(() => frame.limitPerGroup(1, { groupBy: [], orderBy: [] }))
            .toThrow('limitPerGroup requires at least one sort term');
        expect(() => frame.orderBy([{ expression: '"name"' }]).limitPerGroup(1, options))
            .toThrow('limitPerGroup reorders rows');
    });
});

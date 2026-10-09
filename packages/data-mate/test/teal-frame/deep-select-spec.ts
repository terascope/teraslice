import 'jest-extended';
import { FieldType, DataTypeConfig, DataTypeFields } from '@terascope/types';
import { isEmpty } from '@terascope/core-utils';
import { Column, DataFrame } from '../../src/index.js';
import { TealFrame, closeDuckDatabase } from '../../src/teal-frame/index.js';

/**
 * `TealFrame.deepSelect` and `pruneEmptyObjects` against `DataFrame.deepSelect` and the QPL
 * engine's SELECT node (`table-nodes/index.ts`), which runs `deepSelect` and then drops every
 * `_skip_if_empty` Object column left with no children.
*/

const CONFIG: DataTypeConfig = {
    version: 1,
    fields: {
        id: { type: FieldType.Keyword },
        config: { type: FieldType.Object },
        'config.id': { type: FieldType.Keyword },
        'config.name': { type: FieldType.Keyword },
        'config.owner': { type: FieldType.Object },
        'config.owner.id': { type: FieldType.Keyword },
        'config.owner.name': { type: FieldType.Keyword },
        joined: {
            type: FieldType.Object, array: true, _allow_empty: true, _skip_if_empty: true,
        } as DataTypeFields[string],
        'joined.a': { type: FieldType.Keyword },
        'joined.b': { type: FieldType.Integer },
        list: { type: FieldType.Object, array: true },
        'list.x': { type: FieldType.Keyword },
        'list.y': { type: FieldType.Integer },
        loose: { type: FieldType.Object },
        when: { type: FieldType.Date },
    },
};

const RECORDS = [
    {
        id: '1',
        config: { id: 'c1', name: 'config-1', owner: { id: 'o1', name: 'owner-1' } },
        joined: [{ a: 'j', b: 1 }, { a: 'k', b: 2 }],
        list: [{ x: 'x1', y: 1 }, null, { x: 'x2' }],
        loose: { anything: [1, 'two'] },
        when: '2024-01-01T00:00:00.000Z',
    },
    {
        id: '2', config: null, joined: null, list: null, loose: null, when: null,
    },
    {
        id: '3',
        config: { id: 'c3', name: 'config-3', owner: null },
        joined: [],
        list: [],
        loose: {},
    },
];

/** Rows as plain JSON, null fields dropped at every depth: `rows()` writes them, `toJSON` not. */
function plain(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(plain);
    if (value == null || typeof value !== 'object') return value ?? null;
    return Object.fromEntries(Object.entries(value)
        .filter(([, v]) => v != null)
        .map(([k, v]) => [k, plain(v)]));
}

describe('TealFrame.deepSelect', () => {
    let frame: TealFrame;
    let dataFrame: DataFrame<Record<string, any>>;

    beforeAll(async () => {
        frame = await TealFrame.fromRecords(CONFIG, RECORDS, { name: 'deep_select_src' });
        dataFrame = DataFrame.fromJSON<Record<string, any>>(CONFIG, RECORDS);
    });

    afterAll(async () => {
        await frame.destroy();
        await closeDuckDatabase();
    });

    async function rows(selected: TealFrame) {
        const out: unknown[] = [];
        for await (const row of selected.rows()) out.push(row);
        return out;
    }

    const CASES: [string, string[]][] = [
        ['dotted selectors (DataFrame\'s own case)', ['id', 'config.name', 'config.owner.name']],
        ['a parent object and a sibling member', ['id', 'config.name', 'config.owner']],
        ['every nested field', ['config.id', 'config.name', 'config.owner.id', 'config.owner.name']],
        ['one deep member only', ['config.owner.name']],
        ['an _allow_empty parent alone', ['joined']],
        ['an _allow_empty child', ['joined.a']],
        ['part of an array of objects', ['list.x']],
        ['a whole array of objects and a scalar, out of order', ['list', 'id']],
        ['an untyped object and a date', ['loose', 'when']],
        ['names that do not exist, beside one that does', ['nope', 'id', 'config.nope']],
    ];

    it.each(CASES)('%s matches DataFrame', async (_label, selectors) => {
        const selected = frame.deepSelect(selectors);
        const expected = dataFrame.deepSelect(selectors);

        expect(plain(await rows(selected))).toEqual(plain(expected.toJSON()));
        expect(selected.columns).toEqual(expected.columns.map((c) => c.name));
        expect(Object.keys(selected.config.fields).sort())
            .toEqual(Object.keys(expected.config.fields).sort());
    });

    it('gives no columns and no rows when nothing matches, as DataFrame does', async () => {
        const selected = frame.deepSelect(['nope']);
        expect(selected.columns).toEqual([]);
        expect(await selected.size()).toEqual(dataFrame.deepSelect(['nope']).size);
    });

    describe('pruneEmptyObjects', () => {
        /** The engine's SELECT node: `deepSelect`, then drop the empty `_skip_if_empty` Objects. */
        function engineSelect(selectors: string[]): DataFrame<Record<string, any>> {
            const selected = dataFrame.deepSelect(selectors);
            const columns: Column[] = selected.columns.filter((col) => !(
                (col.config as { _skip_if_empty?: boolean })._skip_if_empty
                && col.config.type === FieldType.Object
                && isEmpty(col.vector.childConfig)
            ));
            return selected.fork(columns);
        }

        it.each([
            ['drops an _allow_empty parent selected alone', ['id', 'joined']],
            ['keeps it once a child is selected', ['id', 'joined.b']],
            ['leaves a frame with nothing to drop alone', ['id', 'config.name']],
        ])('%s', async (_label, selectors) => {
            const pruned = frame.deepSelect(selectors).pruneEmptyObjects();
            const expected = engineSelect(selectors);

            expect(pruned.columns).toEqual(expected.columns.map((c) => c.name));
            expect(plain(await rows(pruned))).toEqual(plain(expected.toJSON()));
        });
    });
});

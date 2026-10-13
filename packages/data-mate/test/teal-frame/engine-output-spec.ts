import 'jest-extended';
import { FieldType, DataTypeConfig } from '@terascope/types';
import { DataFrame, ListVector, SerializeOptions, TealFrame } from '../../src/index.js';

/**
 * The two engine paths besides `rows(true, options)` that decide what a response contains
 * (`spaces/packages/qpl-engine/src/v3/execute`):
 *
 * - **`serializeObject`** answers an object-shaped query from a ONE-row frame: its `results` list
 *   column is streamed element by element with `ListVector.getRowIterator(0, true, options)`.
 *   `TealFrame.listValues` is that.
 * - **`finish-scope`** calls `removeEmptyRows()` under `remove_null_fields`, otherwise
 *   `countEmptyRows()`, and reports the count as a metric. A row is empty when EVERY column's
 *   stored value is nil (`isEmptyRow` -> `vector.has`) - storage, not rendering, so `{}` and `[]`
 *   are values.
*/
const FLAGS = [
    'useNullForUndefined',
    'skipNilValues',
    'skipEmptyArrays',
    'skipNilListValues',
    'skipNilObjectValues',
    'skipEmptyObjects',
] as const;

/** Every combination except skipDuplicateObjects, which `getRowIterator` refuses. */
const COMBINATIONS: SerializeOptions[] = Array.from({ length: 2 ** FLAGS.length }, (_, bits) => (
    Object.fromEntries(FLAGS.map((flag, i) => [flag, Boolean(bits & (1 << i))]))
));

function label(options: SerializeOptions): string {
    const on = FLAGS.filter((flag) => options[flag]);
    return on.length ? on.join('+') : '(none)';
}

const CONFIG: DataTypeConfig = {
    version: 1,
    fields: {
        total: { type: FieldType.Integer },
        results: { type: FieldType.Object, array: true },
        'results.id': { type: FieldType.Keyword },
        'results.n': { type: FieldType.Long },
        'results.inner': { type: FieldType.Object },
        'results.inner.x': { type: FieldType.Keyword },
        words: { type: FieldType.Keyword, array: true },
    },
};

/** One-row frames, as `serializeObject` requires, covering each element case. */
const ROWS: Record<string, Record<string, unknown>> = {
    'objects with a nil, an empty and a partial element': {
        total: 4,
        results: [
            { id: 'a', n: '9007199254740993', inner: { x: 'deep' } },
            null,
            {},
            { id: 'b', inner: {} },
            { id: 'a', n: '9007199254740993', inner: { x: 'deep' } },
        ],
        words: ['x', null, 'y'],
    },
    'an empty list': { total: 0, results: [], words: [] },
    'a nil list': { total: 0 },
};

async function collect<T>(iterator: AsyncIterable<T>): Promise<T[]> {
    const out: T[] = [];
    for await (const item of iterator) out.push(item);
    return out;
}

function reference(
    record: Record<string, unknown>, column: string, options: SerializeOptions
): unknown[] {
    const frame = DataFrame.fromJSON(CONFIG, [record]);
    const { vector } = frame.getColumnOrThrow(column);
    if (!(vector instanceof ListVector)) throw new Error(`${column} is not a ListVector`);
    return [...vector.getRowIterator(0, true, options)];
}

describe('TealFrame engine output paths', () => {
    describe('listValues, as ListVector.getRowIterator', () => {
        const frames = new Map<string, TealFrame>();

        beforeAll(async () => {
            for (const [name, record] of Object.entries(ROWS)) {
                frames.set(name, await TealFrame.fromRecords(CONFIG, [record]));
            }
        });

        afterAll(async () => {
            await Promise.all([...frames.values()].map((frame) => frame.destroy()));
        });

        describe.each(Object.keys(ROWS))('for %s', (name) => {
            it.each(COMBINATIONS.map((options) => [label(options), options]))(
                'should yield what DataFrame yields, with %s',
                async (_label, options) => {
                    const frame = frames.get(name)!;
                    for (const column of ['results', 'words']) {
                        expect(await collect(frame.listValues(column, options)))
                            .toEqual(reference(ROWS[name], column, options));
                    }
                }
            );
        });

        it('should refuse skipDuplicateObjects, as DataFrame does', async () => {
            const frame = frames.get('an empty list')!;
            expect(() => reference(ROWS['an empty list'], 'results', { skipDuplicateObjects: true }))
                .toThrow(/skipDuplicateObjects/);
            await expect(collect(frame.listValues('results', { skipDuplicateObjects: true })))
                .rejects.toThrow(/skipDuplicateObjects/);
        });

        it('should refuse a column that is not a list', async () => {
            const frame = frames.get('an empty list')!;
            await expect(collect(frame.listValues('total'))).rejects.toThrow(/not a list/);
        });
    });

    describe('countEmptyRows and removeEmptyRows', () => {
        const records = [
            { total: 1 },
            {},
            { results: [] }, // an empty list is a VALUE, so not an empty row
            { results: [{}] },
            { words: null, results: null, total: null },
            { words: ['w'] },
        ];
        const dataFrame = () => DataFrame.fromJSON(CONFIG, records);
        const PRESERVE: SerializeOptions = {
            useNullForUndefined: true, skipNilValues: false, skipNilObjectValues: true,
        };
        let frame: TealFrame;

        beforeAll(async () => {
            frame = await TealFrame.fromRecords(CONFIG, records);
        });

        afterAll(async () => {
            await frame.destroy();
        });

        it('should count the empty rows DataFrame counts', async () => {
            expect(await frame.countEmptyRows()).toEqual(dataFrame().countEmptyRows());
            expect(await frame.countEmptyRows()).toEqual(2);
        });

        it('should keep the rows DataFrame keeps, in order', async () => {
            const kept = frame.removeEmptyRows();
            expect(await kept.size()).toEqual(dataFrame().removeEmptyRows().size);
            expect(await collect(kept.rows(PRESERVE)))
                .toEqual(dataFrame().removeEmptyRows()
                    .toJSON(PRESERVE)
                    .map((row) => JSON.parse(JSON.stringify(row))));
        });
    });
});

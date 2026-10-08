import 'jest-extended';
import { FieldType, DataTypeConfig } from '@terascope/types';
import { DataFrame } from '../../src/index.js';
import { TealFrame } from '../../src/teal-frame/index.js';

/**
 * A `Tuple` field is output as an ARRAY, as `DataFrame` outputs it.
 *
 * It is stored as a `STRUCT("0" ..., "1" ...)` - a DuckDB LIST cannot hold positions of different
 * types - and before 2026-09-29 both `rows()` and `ndjson()` handed that struct back as an object,
 * `{"0":1.5,"1":"a"}`, instead of `[1.5,"a"]`. **A missing position is `null` INSIDE the array
 * in both modes** - `DataFrame` writes `[2,null]` even when null fields are removed, because a
 * position is not a field.
*/
const CONFIG: DataTypeConfig = {
    version: 1,
    fields: {
        _key: { type: FieldType.Keyword },
        tup: { type: FieldType.Tuple },
        'tup.0': { type: FieldType.Double },
        'tup.1': { type: FieldType.Keyword },
        tups: { type: FieldType.Tuple, array: true },
        'tups.0': { type: FieldType.Double },
        'tups.1': { type: FieldType.Keyword },
        obj: { type: FieldType.Object },
        'obj.pair': { type: FieldType.Tuple },
        'obj.pair.0': { type: FieldType.Long },
        'obj.pair.1': { type: FieldType.Date },
    },
};

const RECORDS = [
    {
        _key: 'a',
        tup: [1.5, 'a'],
        tups: [[1.5, 'a'], [2]],
        obj: { pair: ['9007199254740993', '2026-09-29T01:02:03.456Z'] },
    },
    { _key: 'b', tup: [2], tups: [] },
    { _key: 'c' },
];

const SPACES_DEFAULT = {
    useNullForUndefined: false,
    skipNilValues: true,
    skipEmptyObjects: true,
    skipNilObjectValues: true,
    skipDuplicateObjects: false,
};

const PRESERVE_NULLS = {
    useNullForUndefined: true,
    skipNilValues: false,
    skipEmptyObjects: false,
    skipNilObjectValues: true,
    skipDuplicateObjects: false,
};

async function collect<T>(iterator: AsyncIterable<T>): Promise<T[]> {
    const out: T[] = [];
    for await (const item of iterator) out.push(item);
    return out;
}

describe('TealFrame Tuple output', () => {
    let frame: TealFrame;
    const reference = DataFrame.fromJSON(CONFIG, RECORDS);

    beforeAll(async () => {
        frame = await TealFrame.fromRecords(CONFIG, RECORDS);
    });

    afterAll(async () => {
        await frame.destroy();
    });

    it('should yield a Tuple as an array from rows(), as DataFrame does', async () => {
        const rows = await collect(frame.rows());
        expect(rows).toEqual(reference.toJSON(PRESERVE_NULLS));
    });

    it('should keep a missing position as null inside the array', async () => {
        const [, b] = await collect(frame.rows());
        expect(b.tup).toEqual([2, null]);
    });

    it('should write a Tuple as an array in ndjson(), byte-equal to DataFrame', async () => {
        const lines = await collect(frame.ndjson());
        expect(lines).toEqual(reference.toJSON(SPACES_DEFAULT).map((row) => JSON.stringify(row)));
    });

    it('should write a Tuple as an array with @preserveNullFields, byte-equal to DataFrame', async () => {
        const lines = await collect(frame.ndjson({ removeNullFields: false }));
        expect(lines).toEqual(reference.toJSON(PRESERVE_NULLS).map((row) => JSON.stringify(row)));
    });
});

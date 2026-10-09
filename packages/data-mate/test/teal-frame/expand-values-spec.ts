import 'jest-extended';
import { FieldType, DataTypeConfig, TypedArray } from '@terascope/types';
import {
    Builder, Column, DataFrame, getPointerArray, WritableData
} from '../../src/index.js';
import { TealFrame, closeDuckDatabase } from '../../src/teal-frame/index.js';

/**
 * `TealFrame.expandValues` against the QPL engine's own implementation.
 *
 * `reference` below is spaces' `qpl-engine/src/v3/execute/run-pipeline/operations/table-nodes/
 * expand-values.ts`, ported as-is (logging removed) so the comparison is with the code that runs in
 * production rather than with a reading of it.
*/

function reference(
    frame: DataFrame<Record<string, any>>,
    fieldList: readonly string[],
    corelate: boolean
): DataFrame<Record<string, any>> {
    const fields: ReadonlySet<string> = new Set(fieldList);
    const indices = getPointerArray(frame.size) as TypedArray;
    for (const field of fields) {
        const column = frame.getColumnOrThrow(field) as Column<unknown[]>;
        if (!column.config.array) {
            throw new Error(`Invalid use of @expandValues on field "${column.name}", expected array value`);
        }
        for (const [index, value] of column.vector.values()) {
            const len = value.length;
            if (len > 0) {
                indices[index] = corelate ? Math.max(indices[index], len) : indices[index] + len;
            }
        }
    }
    let size = 0;
    indices.forEach((count, index) => {
        if (count === 0) {
            indices[index] = 1;
            size++;
        } else {
            size += count;
        }
    });

    const builders = new Map<string, Builder<any>>();
    const columns = new Map<string, Column<unknown>>();
    for (const column of frame.columns) {
        columns.set(column.name, column);
        builders.set(column.name, Builder.make(new WritableData(size), {
            childConfig: column.vector.childConfig,
            config: fields.has(column.name)
                ? { ...column.vector.config, array: false }
                : column.config,
            name: column.name,
        }));
    }

    let readIndex = 0;
    let writeIndex = 0;
    let valuesWritten = 0;
    for (const count of indices) {
        for (const [name, builder] of builders) {
            const value = columns.get(name)!.vector.get(readIndex);
            if (fields.has(name)) {
                if (Array.isArray(value)) {
                    const valueWriteIndex = writeIndex + valuesWritten;
                    let valIndex = 0;
                    for (const v of value) {
                        builder.set(valueWriteIndex + valIndex, v);
                        valIndex++;
                    }
                    valuesWritten += valIndex;
                }
                if (corelate) valuesWritten = 0;
            } else if (value != null) {
                for (let i = writeIndex; i < writeIndex + count; i++) builder.set(i, value);
            }
        }
        readIndex++;
        writeIndex += corelate ? count : Math.max(valuesWritten, 1);
        valuesWritten = 0;
    }
    return frame.fork([...builders].map(([name, builder]) => (
        columns.get(name)!.fork(builder.toVector())
    )));
}

const CONFIG: DataTypeConfig = {
    version: 1,
    fields: {
        _key: { type: FieldType.Keyword },
        arr: { type: FieldType.Integer, array: true },
        num: { type: FieldType.Number },
        str_arr: { type: FieldType.Keyword, array: true },
        dates: { type: FieldType.Date, array: true },
        seen: { type: FieldType.Date },
    },
};

const RECORDS = [
    {
        _key: 'foo', arr: [1, 2, 3], num: 1.5, str_arr: ['foo', 'bar'],
        dates: ['2024-01-01T00:00:00.000Z'], seen: '2024-06-01T00:00:00.000Z',
    },
    {
        _key: 'bar', arr: [4, 5, 6], num: null, str_arr: ['foo2', 'bar2', 'baz2'], dates: []
    },
    {
        _key: 'empty', arr: [], num: 2, str_arr: [], dates: null
    },
    {
        _key: 'nulls', arr: null, num: null, str_arr: null, dates: null, seen: null
    },
    {
        _key: 'holes', arr: [7, null, 9], num: 3, str_arr: [null], dates: ['2024-02-02T00:00:00.000Z', null]
    },
    {
        _key: 'one-sided', arr: null, num: 4, str_arr: ['only'], dates: null
    },
];

/**
 * Rows as plain JSON, a null field dropped: `rows()` writes every column and `DataFrame.toJSON`
 * leaves a nil one out - the same absence, spelled two ways. A null ELEMENT inside a list is kept.
*/
function plain(rows: readonly unknown[]): unknown[] {
    return JSON.parse(JSON.stringify(rows, (_k, v) => (v === undefined ? null : v)))
        .map((row: Record<string, unknown>) => Object.fromEntries(
            Object.entries(row).filter(([, value]) => value !== null)
        ));
}

describe('TealFrame.expandValues', () => {
    let frame: TealFrame;
    let dataFrame: DataFrame<Record<string, any>>;

    beforeAll(async () => {
        frame = await TealFrame.fromRecords(CONFIG, RECORDS, { name: 'expand_src' });
        dataFrame = DataFrame.fromJSON<Record<string, any>>(CONFIG, RECORDS);
    });

    afterAll(async () => {
        await frame.destroy();
        await closeDuckDatabase();
    });

    async function rows(expanded: TealFrame) {
        const out: unknown[] = [];
        for await (const row of expanded.rows()) out.push(row);
        return out;
    }

    const CASES: [string, string[], boolean][] = [
        ['one field, correlated (on a search)', ['arr'], true],
        ['two fields, correlated - a positional zip', ['arr', 'str_arr'], true],
        ['three fields, correlated', ['dates', 'arr', 'str_arr'], true],
        ['one field, per field', ['arr'], false],
        ['two fields, per field - stacked blocks', ['arr', 'str_arr'], false],
        ['fields named out of column order, per field', ['str_arr', 'arr'], false],
        ['a Date[] with a copied Date, per field', ['dates'], false],
    ];

    it.each(CASES)('%s matches the engine, row for row', async (_label, fields, correlate) => {
        const actual = await rows(frame.expandValues(fields, { correlate }));
        const expected = reference(dataFrame, fields, correlate).toJSON();

        expect(plain(actual)).toEqual(plain(expected));
    });

    it('marks the expanded fields as no longer arrays', () => {
        const expanded = frame.expandValues(['arr'], { correlate: true });
        expect(expanded.config.fields.arr.array).toBeFalse();
        expect(expanded.config.fields.str_arr.array).toBeTrue();
    });

    it('refuses a field that is not an array, as the engine does', () => {
        expect(() => frame.expandValues(['num'], { correlate: true }))
            .toThrow('Invalid use of @expandValues on field "num", expected array value');
    });
});

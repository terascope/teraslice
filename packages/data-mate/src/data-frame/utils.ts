import { LATEST_VERSION } from '@terascope/data-types';
import {
    DataTypeConfig, ReadonlyDataTypeConfig, DataTypeFields,
    DataTypeVersion
} from '@terascope/types';
import { Builder, getBuildersForConfig } from '../builder/index.js';
import { Column, KeyAggFn } from '../column/index.js';

export function buildRecords<T extends Record<string, any>>(
    builders: Map<keyof T, Builder<unknown>>,
    records: T[],
): [keyof T, Builder<any>][] {
    const _builders = [...builders];
    const append = _buildersAppend(_builders);
    const len = records.length;
    for (let i = 0; i < len; i++) {
        append(records[i]);
    }
    return _builders;
}

function _buildersAppend<T extends Record<string, any>>(
    builders: [keyof T, Builder<any>][]
): (record: T) => void {
    const len = builders.length;
    return function __buildersAppend(record: T) {
        for (let i = 0; i < len; i++) {
            builders[i][1].append(record[builders[i][0]]);
        }
    };
}

export function distributeRowsToColumns<T extends Record<string, any>>(
    config: DataTypeConfig|ReadonlyDataTypeConfig, records: T[]
): Column<any, keyof T>[] {
    return buildRecords(
        getBuildersForConfig<T>(config, records.length),
        records
    ).map(([name, builder]) => (
        new Column(builder.toVector(), {
            name,
            version: config.version
        })
    ));
}

export function concatColumnsToColumns<T extends Record<string, any>>(
    builders: Map<keyof T, Builder<any>>,
    columns: readonly Column<any, keyof T>[],
    offset: number
): [keyof T, Builder<any>][] {
    for (const [field, builder] of builders) {
        const col = columns.find(((c) => c.name === field));
        if (col) {
            for (const [i, v] of col.vector.values()) {
                builder.data.set(i + offset, v);
            }
        }
    }
    return [...builders];
}

export function columnsToDataTypeConfig<T extends Record<string, unknown>>(
    columns: readonly Column<unknown, keyof T>[]
): DataTypeConfig {
    const versions = new Set<DataTypeVersion>();
    const fields: DataTypeFields = {};
    for (const col of columns) {
        versions.add(col.version);
        fields[String(col.name)] = col.config;
        // make sure we populate the nested fields
        if (col.vector.childConfig) {
            for (const nestedField of Object.keys(col.vector.childConfig)) {
                fields[`${String(col.name)}.${nestedField}`] = col.vector.childConfig[nestedField];
            }
        }
    }
    return {
        version: versions.size ? (Math.max(...versions) as DataTypeVersion) : LATEST_VERSION,
        fields,
    };
}

export function* columnsToBuilderEntries<T extends Record<string, unknown>>(
    columns: readonly Column<any, keyof T>[],
    size: number
): Iterable<[keyof T, Builder]> {
    for (const column of columns) {
        yield _columnToBuilderEntry(column, size);
    }
}

function _columnToBuilderEntry<T extends Record<string, unknown>>(
    column: Column<any, keyof T>, size: number
): [keyof T, Builder<any>] {
    return [column.name, Builder.makeFromVector<any>(
        column.vector, size
    )];
}

export function processFieldFilter(
    indices: Set<number>,
    column: Column<any>,
    filter: (value: any) => boolean,
    json: boolean
): void {
    function getValue(v: any): any {
        if (!json || !column.vector.toJSONCompatibleValue) return v;
        return column.vector.toJSONCompatibleValue(v);
    }
    for (const [i, v] of column.vector.values()) {
        if (filter(getValue(v))) indices.add(i);
        else indices.delete(i);
    }
}

export function createColumnsWithIndices<T extends Record<string, any>>(
    columns: readonly Column<any, keyof T>[],
    indices: Iterable<number>,
    size: number
): readonly Column<any, keyof T>[] {
    const builders = getBuildersForConfig<T>(
        columnsToDataTypeConfig(columns), size
    );

    for (const index of indices) {
        for (const col of columns) {
            const val = col.vector.get(index);
            builders.get(col.name)!.append(val);
        }
    }

    function finish(col: Column<any, keyof T>): Column<any, keyof T> {
        return col.fork(builders.get(col.name)!.toVector());
    }
    return columns.map(finish);
}

export function* indicesFilterIterable(
    n: number, fn: (index: number) => boolean
): Iterable<number> {
    for (let i = 0; i < n; i++) {
        if (fn(i)) yield i;
    }
}

export function makeUniqueRowBuilder<T extends Record<string, any>>(
    builders: Map<keyof T, Builder<any>>,
    buckets: Set<string>,
    getColumnValue: (name: keyof T, i: number) => any
) {
    return function uniqueRowBuilder(row: Partial<T>, key: string, index: number): void {
        const resultIndex = buckets.size;
        buckets.add(key);

        for (const [name, builder] of builders) {
            if (name in row) {
                builder.set(resultIndex, row[name]);
            } else {
                builder.set(resultIndex, getColumnValue(name, index));
            }
        }
    };
}

export function makeKeyForRow<T extends Record<string, any>>(
    keyAggs: Map<keyof T, KeyAggFn>,
    index: number
): { row: Partial<T>; key: string }|undefined {
    const row: Partial<T> = Object.create(null);

    let groupKey = '';
    let keyIndex = 0;
    let hasValues = false;

    for (const [field, getKey] of keyAggs) {
        const res = getKey(index);
        groupKey += keyIndex++;
        if (res.key) {
            hasValues = true;
            groupKey += res.key;
        }

        row[field] = res.value as any;
    }

    // this ensures that without a key aggregation
    // we create a global bucket
    if (!hasValues && keyAggs.size) return;

    return {
        row,
        key: groupKey,
    };
}

/**
 * Sort the columns by likelihood of the values being there,
 * this was initially created to be used in combination with isEmptyRow
*/
export function getSortedColumnsByValueCount(
    _columns: readonly Column<any, any>[]
): readonly Column<any, any>[] {
    return _columns
        .map((col): [Column<any, any>, number] => [col, col.vector.countValues()])
        // this will reverse order the columns by count of values
        .sort((a, b) => b[1] - a[1])
        .map(([col]) => col);
}

/**
 * Verify the a column has null fields in a
*/
export function isEmptyRow(columns: readonly Column<any, any>[], row: number): boolean {
    for (const col of columns) {
        if (col.vector.has(row)) return false;
    }
    return true;
}

export function splitOnNewLineIterator(data: Buffer|string): Iterable<Buffer|string> {
    if (typeof data === 'string') {
        return splitStringOnNewLineIterator(data);
    }
    return splitBufferOnNewLineIterator(data);
}

function* splitStringOnNewLineIterator(data: string): Iterable<string> {
    let startIndex = 0;
    let isEndSlice = false;

    while (true) {
        let newLineIndex = data.indexOf('\n', startIndex);

        if (newLineIndex === -1) {
            if (isEndSlice) return;
            isEndSlice = true;
            newLineIndex = data.length;
        }

        yield data.slice(startIndex, newLineIndex);
        startIndex = newLineIndex + 1;
    }
}

const NEW_LINE_BYTE_CODE = 10;
function* splitBufferOnNewLineIterator(data: Buffer): Iterable<Buffer> {
    let startIndex = 0;
    let isEndSlice = false;

    while (true) {
        let newLineIndex = data.indexOf(NEW_LINE_BYTE_CODE, startIndex);

        if (newLineIndex === -1) {
            if (isEndSlice) return;
            isEndSlice = true;
            newLineIndex = data.length;
        }

        yield data.subarray(startIndex, newLineIndex);
        startIndex = newLineIndex + 1;
    }
}

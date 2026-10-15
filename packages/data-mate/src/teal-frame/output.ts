import { DataTypeConfig } from '@terascope/types';
import { DataType } from '@terascope/data-types';
import { quoteIdentifier, quoteLiteral } from '@terascope/sql-builder';
import { DuckContext } from './DuckContext.js';
import {
    buildJsonExpression, buildJsonListElements, buildJsonRowFilter, JsonExportOptions,
    resolveRules
} from './export-json.js';
import { int64Column } from './parquet-columns.js';
import { FrameConfig } from './interfaces.js';

/**
 * Implementations of `TealFrame`'s output methods: `writeParquet`, the JSON-lines query behind
 * `ndjson`, `writeNDJSON` and `rows(options)`, and `listValues`. Their contracts are documented
 * on `TealFrame`.
*/

/** Writes the frame to a zstd Parquet file, narrowing 128-bit columns to their declared type. */
export async function writeParquet(
    ctx: DuckContext,
    from: string,
    config: FrameConfig,
    path: string
): Promise<void> {
    const columns = await ctx.columnTypes(`SELECT * FROM ${from}`);
    const declared = new DataType(config as DataTypeConfig).toDuckDB();
    const list = columns
        .map(({ name, type }) => int64Column(name, type, declared[name]))
        .join(', ');

    // GEOPARQUET_VERSION 'BOTH' writes Parquet's native GEOMETRY logical type, which, unlike
    // the GeoParquet 1.0 default, also works for nested values. A GeoJSON array or an object's
    // GeoJSON member then reads back as GEOMETRY instead of BLOB (BLOB has no cast to
    // GEOMETRY). The 1.0 metadata is still written for readers that only support it.
    await ctx.run(
        `COPY (SELECT ${list} FROM ${from}) TO ${quoteLiteral(path)}`
        + ' (FORMAT parquet, COMPRESSION zstd, GEOPARQUET_VERSION \'BOTH\')'
    );
}

/**
 * SQL that renders one JSON line per row, as `DataFrame.toJSON` does with the same options.
 * Rows that `skipEmptyObjects` drops are filtered out. See `export-json.ts`.
*/
export function jsonLinesSQL(
    from: string,
    config: FrameConfig,
    options: JsonExportOptions
): string {
    const expression = buildJsonExpression(config, options);
    const filter = buildJsonRowFilter(config, options);
    return `SELECT ${expression} AS json FROM ${from}` + (filter ? ` WHERE ${filter}` : '');
}

/** Yields one row's LIST column element by element, like `ListVector.getRowIterator`. */
export async function* listValues(
    ctx: DuckContext,
    from: string,
    config: FrameConfig,
    column: string,
    options: JsonExportOptions
): AsyncIterableIterator<unknown> {
    const rules = resolveRules(options);
    if (rules.skipDuplicateObjects) {
        throw new Error('ListVector->getIterator is incompatible with skipDuplicateObjects');
    }
    const { sql, isObject } = buildJsonListElements(config, column, options);
    const nilValue = rules.useNullForUndefined ? null : undefined;
    const skipNil = rules.skipNilListValues || (isObject && rules.skipNilObjectValues);

    if (rules.skipEmptyArrays) {
        const values = await ctx.scalar(`SELECT count(${quoteIdentifier(column)}) FROM ${from}`);
        if (Number(values) === 0) return;
    }

    const [row] = await ctx.rows(`SELECT ${sql} FROM ${from} LIMIT 1`);
    if (row == null) return;

    const elements = row[0] as (string | null)[] | null;
    if (elements == null) {
        if (!skipNil) yield nilValue;
        return;
    }
    for (const element of elements) {
        if (element != null) yield JSON.parse(element);
        else if (!skipNil) yield nilValue;
    }
}

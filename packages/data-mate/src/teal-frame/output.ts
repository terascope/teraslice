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
 * The bodies of `TealFrame`'s output methods - `writeParquet`, the ldjson projection behind
 * `ndjson`/`writeNDJSON`/`rows(options)`, and `listValues`. The methods and their contracts are
 * documented on `TealFrame`; this is the SQL and iteration they run.
*/

/** `writeParquet`: zstd, every 128-bit column narrowed to its declared type. */
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

    // GEOPARQUET_VERSION 'BOTH': Parquet's native GEOMETRY logical type, which - unlike the
    // GeoParquet 1.0 default - survives NESTING, so a GeoJSON array or an object's GeoJSON
    // member reads back as GEOMETRY rather than as BLOB (and BLOB -> GEOMETRY has no cast).
    // The 1.0 metadata is still written, for readers that only know it.
    await ctx.run(
        `COPY (SELECT ${list} FROM ${from}) TO ${quoteLiteral(path)}`
        + ' (FORMAT parquet, COMPRESSION zstd, GEOPARQUET_VERSION \'BOTH\')'
    );
}

/**
 * One JSON line per row, as `DataFrame.toJSON` renders it with the same options - minus the rows
 * `skipEmptyObjects` drops, which render as NULL. See `export-json.ts`.
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

/** `listValues`: one row's LIST column, element by element, as `ListVector.getRowIterator`. */
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

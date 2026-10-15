import { quoteLiteral } from '@terascope/sql-builder';
import { AppendSource } from './interfaces.js';

/**
 * Helpers that describe where rows come from: a Parquet relation, or an append's source.
*/

/**
 * Returns `read_parquet(...)` over one path or many.
 *
 * A list of files reads as a single relation, so several Parquet payloads can be loaded as
 * one table.
*/
export function readParquetSource(paths: string | readonly string[]): string {
    if (typeof paths === 'string') return `read_parquet(${quoteLiteral(paths)})`;
    if (paths.length === 0) {
        throw new TypeError('at least one Parquet path is required');
    }
    return `read_parquet([${paths.map(quoteLiteral).join(', ')}])`;
}

/** Names what was being appended, for an error message. */
export function describeSource(source: AppendSource): string {
    if (source.records !== undefined) return `${source.records.length} record(s)`;
    const { parquet } = source;
    if (typeof parquet === 'string') return `Parquet "${parquet}"`;
    return `${parquet.length} Parquet path(s)`;
}

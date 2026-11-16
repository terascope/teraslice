import type { TerasliceApiV2 } from '@terascope/types';
import type { RecordsWithTotal } from '../storage/index.js';

/**
 * Builds a v2 list response from one page of records and the total.
 *
 * `has_more` depends on how exact the total is:
 * - `eq`: whether any records come after this page.
 * - `gte`: whether this page is full. The total is only a lower bound, so
 *   a full page is the only sign of more. When the last page is exactly
 *   full, this says `true` and the next page is empty.
 */
export function toPage<T>(
    { records, total, relation }: RecordsWithTotal<T>,
    from: number,
    size: number
): TerasliceApiV2.Page<T> {
    const hasMore = relation === 'eq'
        ? from + records.length < total
        : records.length === size;

    return {
        data: records,
        pagination: {
            total,
            total_relation: relation,
            from,
            size,
            has_more: hasMore,
        },
    };
}

/**
 * Pages a list held in memory, in the same shape as a search, so it can be
 * passed to `toPage()`. Sorts a copy, so `list` is left as it is. The
 * total is the list's length, so it's always exact.
 */
export function pageInMemory<T>(
    list: readonly T[],
    compareFn: (a: T, b: T) => number,
    from: number,
    size: number
): RecordsWithTotal<T> {
    return {
        records: list.toSorted(compareFn).slice(from, from + size),
        total: list.length,
        relation: 'eq',
    };
}

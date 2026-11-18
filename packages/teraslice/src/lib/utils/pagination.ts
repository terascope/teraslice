import type { TerasliceApiV2 } from '@terascope/types';
import type { RecordsWithTotal } from '../storage/index.js';

/**
 * Builds a v2 list response from one page of records and the total.
 * `has_more` is whether any records come after this page.
 */
export function toPage<T>(
    { records, total }: RecordsWithTotal<T>,
    from: number,
    size: number
): TerasliceApiV2.Page<T> {
    return {
        data: records,
        pagination: {
            total,
            from,
            size,
            has_more: from + records.length < total,
        },
    };
}

/**
 * The headers a /v2/txt list route sends, so a client can page without
 * parsing the footer. Each maps to its description, for a text route's
 * `responseHeaders`.
 */
export const paginationResponseHeaders = {
    'X-Total-Count': 'The exact number of matching records',
    'X-From': 'The offset of the first record in the response',
    'X-Size': 'The requested page size',
} as const;

/** The `paginationResponseHeaders` values for one page */
export function paginationHeaders(
    pagination: TerasliceApiV2.Pagination
): Record<keyof typeof paginationResponseHeaders, string> {
    return {
        'X-Total-Count': String(pagination.total),
        'X-From': String(pagination.from),
        'X-Size': String(pagination.size),
    };
}

/**
 * Pages a list held in memory, in the same shape as a search, so it can be
 * passed to `toPage()`. Sorts a copy, so `list` is left as it is. The
 * total is the list's length.
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
    };
}

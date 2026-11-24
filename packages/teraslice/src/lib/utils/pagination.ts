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

/**
 * Compares by each key in turn, for `pageInMemory()`, so pages are stable
 * while the list is. Numbers compare as numbers, anything else as a string,
 * by code unit. A missing value sorts first.
 */
export function byKeys(...keys: string[]): (a: object, b: object) => number {
    return (a, b) => {
        for (const key of keys) {
            const order = compareValues(
                (a as Record<string, unknown>)[key],
                (b as Record<string, unknown>)[key]
            );
            if (order !== 0) return order;
        }
        return 0;
    };
}

function compareValues(a: unknown, b: unknown): number {
    if (typeof a === 'number' && typeof b === 'number') return a - b;

    const x = String(a ?? '');
    const y = String(b ?? '');
    if (x < y) return -1;
    if (x > y) return 1;
    return 0;
}

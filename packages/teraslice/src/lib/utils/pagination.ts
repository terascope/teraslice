import type { TerasliceApiV2 } from '@terascope/types';
import type { SortValue } from '@terascope/elasticsearch-api';
import type { RecordsWithTotal } from '../storage/index.js';
import { decodeCursor, encodeCursor } from './cursor.js';

/**
 * Where a requested page starts, from its `from` or `cursor` query param.
 * See `pageStart()`.
 */
export interface PageStart {
    /** How many records come before the page, for the response */
    from: number;
    /** The cursor's sort values; the page starts after them */
    after?: SortValue[];
    /** `queryKey()` of the request, for the next page's cursor */
    key: string;
}

/**
 * Reads where a page starts. With a `cursor`, it's after the cursor's sort
 * values, and `from` is the cursor's count; otherwise it's the `from` param.
 * A cursor that's invalid or made for another `key` is a 400.
 */
export function pageStart(
    { from, cursor }: { from: number; cursor?: string },
    key: string
): PageStart {
    if (cursor === undefined) return { from, key };

    const { after, from: cursorFrom } = decodeCursor(cursor, key);
    return { from: cursorFrom, after, key };
}

/**
 * The paging part of a storage search for a page: `searchAfter` (with
 * `from: 0`, which OpenSearch requires with it) for a cursor, `from` otherwise.
 */
export function searchFrom(
    { from, after }: PageStart
): { from: number; searchAfter?: SortValue[] } {
    return after ? { from: 0, searchAfter: after } : { from };
}

/**
 * Builds a v2 list response from one page of records and the total.
 * `has_more` is whether any records come after this page. `next_cursor` is
 * set when there are, and the page has a last record to continue after.
 *
 * Without a cursor, `from` is exact, so `has_more` compares it with the
 * total. After a cursor, `from` is the count the cursor carried, which is
 * off once records before the cursor are added or deleted, so the page's
 * length decides instead: a full page may have more after it, a short one
 * doesn't. That can cost one extra, empty page, but never ends early.
 */
export function toPage<T>(
    { records, total, lastSort }: RecordsWithTotal<T>,
    { from, after, key }: PageStart,
    size: number
): TerasliceApiV2.Page<T> {
    const hasMore = after && size > 0
        ? records.length === size
        : from + records.length < total;
    const nextCursor = hasMore && records.length && lastSort?.length
        ? encodeCursor({ after: lastSort, from: from + records.length, key })
        : null;

    return {
        data: records,
        pagination: {
            total,
            from,
            size,
            has_more: hasMore,
            next_cursor: nextCursor,
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
    'X-Next-Cursor': 'Send as `cursor` to get the next page. Left out on the last page, '
        + 'and with `size=0`',
} as const;

/** The `paginationResponseHeaders` values for one page */
export function paginationHeaders(
    pagination: TerasliceApiV2.Pagination
): Record<string, string> {
    return {
        'X-Total-Count': String(pagination.total),
        'X-From': String(pagination.from),
        'X-Size': String(pagination.size),
        ...(pagination.next_cursor && { 'X-Next-Cursor': pagination.next_cursor }),
    };
}

/**
 * Pages a list held in memory, in the same shape as a search, so it can be
 * passed to `toPage()`. Sorts a copy by `keys` (see `byKeys()`), so `list`
 * is left as it is. The total is the list's length.
 *
 * With `start.after` (a cursor), the page starts at the first item that
 * sorts after those key values, so items that go away between requests
 * don't shift the page; otherwise at `start.from`. `lastSort` is the last
 * item's key values.
 */
export function pageInMemory<T extends object>(
    list: readonly T[],
    keys: readonly string[],
    { from, after }: Pick<PageStart, 'from' | 'after'>,
    size: number
): RecordsWithTotal<T> {
    const compare = byKeys(keys);
    const sorted = list.toSorted(compare);

    let start = from;
    if (after) {
        const afterItem = Object.fromEntries(keys.map((key, i) => [key, after[i]]));
        const index = sorted.findIndex((item) => compare(item, afterItem) > 0);
        start = index === -1 ? sorted.length : index;
    }

    const records = sorted.slice(start, start + size);
    const last = records.at(-1);

    return {
        records,
        total: list.length,
        lastSort: last && keys.map((key) => toSortValue((last as Record<string, unknown>)[key])),
    };
}

/**
 * A key's value as a cursor holds it. Anything other than a number is
 * compared as a string (see `compareValues()`), so it's kept as one.
 */
function toSortValue(value: unknown): SortValue {
    if (value == null) return null;
    if (typeof value === 'number') return value;
    return String(value);
}

/**
 * Compares by each key in turn, so pages are stable while the list is.
 * Numbers compare as numbers, anything else as a string, by code unit.
 * A missing value sorts first.
 */
export function byKeys(keys: readonly string[]): (a: object, b: object) => number {
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

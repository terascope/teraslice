import { TerasliceApiV2 } from '@terascope/types';
import type { TerasliceRequest } from '../../../../../interfaces.js';
import type { RecordsWithTotal } from '../../../../storage/index.js';
import {
    explainResultWindowError, parseFields, printPagedTable
} from '../../../../utils/api_utils.js';
import { paginationHeaders, paginationResponseHeaders } from '../../../../utils/pagination.js';
import type { Parsed, TextResult } from '../../../../utils/v2_routes.js';

/*
 * Helpers shared by the v2 registries: the master's (`routes.ts`) and the
 * assets service's (`asset-routes.ts`).
 */

/** The spec fields every /txt route shares */
export const txtRouteSpec = {
    tags: ['Text'],
    response: TerasliceApiV2.TxtTableSchema,
    format: 'text',
    responseHeaders: paginationResponseHeaders,
} as const;

/** The table options every /txt route's query has, once parsed */
type TxtTableQuery = Pick<Parsed<typeof TerasliceApiV2.GetTxtJobsQuerySchema>, 'fields' | 'headers'>;

/**
 * The response of a /txt route: the page as a table with its footer, and
 * the paging headers. `fields` picks the columns, or `defaults` when empty.
 * `req` gives the query string the footer's `next` line builds on.
 */
export function toTextTable<T extends Record<string, any>>(
    page: TerasliceApiV2.Page<T>,
    defaults: readonly string[],
    { fields, headers }: TxtTableQuery,
    req: TerasliceRequest
): TextResult {
    return {
        body: printPagedTable({
            page,
            fields: parseFields(fields, defaults),
            headers,
            requestQuery: requestQueryString(req),
        }),
        headers: paginationHeaders(page.pagination),
    };
}

/** The request's query string, as it was sent, without the `?` */
function requestQueryString(req: TerasliceRequest): string {
    const index = req.originalUrl.indexOf('?');
    return index === -1 ? '' : req.originalUrl.slice(index + 1);
}

/** Applies `fn` to each record, keeping the total */
export function mapRecords<T, U>(
    { records, ...rest }: RecordsWithTotal<T>,
    fn: (record: T) => U
): RecordsWithTotal<U> {
    return { ...rest, records: records.map(fn) };
}

/**
 * The sort to search with. v1 falls back to the default for `?sort=` (empty)
 * as well as for no `sort`; the schema default only covers the latter.
 */
export function sortOrDefault(sort: string, fallback = '_updated:desc'): string {
    return sort || fallback;
}

/**
 * Runs a paged search, replacing OpenSearch's message for paging past
 * `max_result_window` with one that makes sense to API callers.
 */
export async function pagedSearch<T>(search: () => Promise<T>): Promise<T> {
    try {
        return await search();
    } catch (err) {
        throw explainResultWindowError(err);
    }
}

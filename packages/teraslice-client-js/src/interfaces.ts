import { OptionsInit } from 'got';
import type { TerasliceApiV2 } from '@terascope/types';

export interface ClientConfig {
    host?: string;
    baseUrl?: string;
    apiVersion?: string;
    timeout?: number;
}

export type RequestOptions = OptionsInit;

/**
 * Query of `cluster.txt()`: the table's `fields` and `headers`, paging, and
 * the list route's own params (e.g. `deleted` for jobs). /v2 rejects a
 * param the route doesn't take, or a field its rows don't have.
 */
export type TxtQuery = TerasliceApiV2.GetTxtJobsQuery
    | TerasliceApiV2.GetTxtExecutionsQuery
    | TerasliceApiV2.GetTxtWorkersQuery
    | TerasliceApiV2.GetTxtNodesQuery
    | TerasliceApiV2.GetTxtControllersQuery
    | TerasliceApiV2.GetTxtAssetsQuery;

export type PostData = string | NodeJS.ReadableStream | Buffer;

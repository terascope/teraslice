import { ElasticsearchDistribution } from '@terascope/types';
import type {
    Elasticsearch6Params, Elasticsearch7Params,
    Elasticsearch8TypeParams, Elasticsearch8TypeWithBodyParams,
    Opensearch1Params
} from './interfaces';
import type { Semver } from '../interfaces';

export type Elasticsearch6CountParams = Elasticsearch6Params.Count
export type Elasticsearch7CountParams = Elasticsearch7Params.Count
export type Elasticsearch8CountParams =
    Elasticsearch8TypeParams.CountRequest
    | Elasticsearch8TypeWithBodyParams.CountRequest;

export type Opensearch1CountParams = Opensearch1Params.Count;

export type CountParams =
    Elasticsearch6CountParams
    | Elasticsearch7CountParams
    | Elasticsearch8CountParams
    | Opensearch1CountParams

export function convertCountParams(
    params: Record<string, any>,
    distribution: ElasticsearchDistribution,
    version: Semver
) {
    const [majorVersion] = version;
    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            // make sure to remove type
            const {
                type, body, query,
                ignore, method, source,
                ...parsedParams
            } = params;
            const queryDSL = query ?? body?.query;
            // body is deprecated, its now put in query parameter
            parsedParams.query = queryDSL;
            return parsedParams as Opensearch1CountParams;
        }

        if (majorVersion === 7) {
            const {
                body, query, ignore,
                ...parsedParams
            } = params;
            const queryDSL = query ?? body.query;
            // make sure query is put on body if it exists since this
            // version requires body
            parsedParams.body = { query: queryDSL };
            return parsedParams;
        }

        if (majorVersion === 6) {
            const {
                body, query,
                ...parsedParams
            } = params;
            const queryDSL = query ?? body.query;
            // make sure query is put on body if it exists since this
            // version requires body
            parsedParams.body = { query: queryDSL };
            return parsedParams;
        }

        throw new Error(`unsupported elasticsearch version: ${version.join('.')}`);
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            const {
                body, query, ignore,
                ...parsedParams
            } = params;
            const queryDSL = query ?? body.query;
            // query does not exist on elasticsearch, migrate it to
            // body for compatibility
            parsedParams.body = { query: queryDSL };
            return parsedParams;
        }

        throw new Error(`unsupported opensearch version: ${version.join('.')}`);
    }

    throw new Error(`unsupported distribution ${distribution}`);
}

import { ElasticsearchDistribution } from '@terascope/types';
import type { Count as Opensearch1CountParams } from './interfaces';
import type { Count as Elasticsearch6CountParams } from 'elasticsearch6/api/requestParams';
import type { Count as Elasticsearch7CountParams } from 'elasticsearch7';
import type { Client as Elasticsearch8CountParams } from 'elasticsearch8';
import type { Semver } from '../interfaces';


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

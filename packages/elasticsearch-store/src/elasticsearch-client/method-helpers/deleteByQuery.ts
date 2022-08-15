import { ElasticsearchDistribution } from '@terascope/types';
import type {
    Elasticsearch6Params, Elasticsearch7Params,
    Elasticsearch8TypeParams, Elasticsearch8TypeWithBodyParams,
    Opensearch1Params
} from './interfaces';
import type { Semver } from '../interfaces';

export type Elasticsearch6DeleteByQueryParams = Elasticsearch6Params.DeleteByQuery
export type Elasticsearch7DeleteByQueryParams = Elasticsearch7Params.DeleteByQuery
export type Elasticsearch8DeleteByQueryParams =
    Elasticsearch8TypeParams.DeleteByQueryRequest
    | Elasticsearch8TypeWithBodyParams.DeleteByQueryRequest;
export type Opensearch1DeleteByQueryParams = Opensearch1Params.DeleteByQuery;

export type DeleteByQueryResponse = Elasticsearch8TypeParams.DeleteByQueryResponse

export type DeleteByQueryParams =
    Elasticsearch6DeleteByQueryParams
    | Elasticsearch7DeleteByQueryParams
    | Elasticsearch8DeleteByQueryParams
    | Opensearch1DeleteByQueryParams

export function convertDeleteByQueryParams(
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
                _source_exclude, _source_include,
                _source, _source_excludes, _source_includes,
                ...parsedParams
            } = params;
            const queryDSL = query ?? body?.query;
            // body is deprecated, its now put in query parameter
            parsedParams.query = queryDSL;
            return parsedParams;
        }

        if (majorVersion === 7) {
            const {
                body, query, max_docs,
                _source_exclude, _source_include,
                _source, _source_excludes, _source_includes,
                ...parsedParams
            } = params;

            parsedParams._source_includes = _source_includes ?? _source_include;
            parsedParams._source_excludes = _source_excludes ?? _source_exclude;
            parsedParams.max_docs = max_docs ?? body.max_docs;
            const queryDSL = query ?? body?.query;

            parsedParams.body = { query: queryDSL };
            return parsedParams;
        }

        if (majorVersion === 6) {
            const {
                body, query, max_docs,
                _source_exclude, _source_include,
                _source, _source_excludes, _source_includes,
                ...parsedParams
            } = params;

            parsedParams._source_includes = _source_includes ?? _source_include;
            parsedParams._source_excludes = _source_excludes ?? _source_exclude;
            parsedParams.max_docs = max_docs ?? body.max_docs;
            const queryDSL = query ?? body?.query;

            parsedParams.body = { query: queryDSL };
            return parsedParams;
        }

        throw new Error(`unsupported elasticsearch version: ${version.join('.')}`);
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            const {
                body, query, max_docs,
                _source_exclude, _source_include,
                _source, _source_excludes, _source_includes,
                ...parsedParams
            } = params;

            parsedParams._source_includes = _source_includes ?? _source_include;
            parsedParams._source_excludes = _source_excludes ?? _source_exclude;
            parsedParams.max_docs = max_docs ?? body.max_docs;
            const queryDSL = query ?? body?.query;

            parsedParams.body = { query: queryDSL };
            return parsedParams;
        }

        throw new Error(`unsupported opensearch version: ${version.join('.')}`);
    }

    throw new Error(`unsupported distribution ${distribution}`);
}

import { ElasticsearchDistribution } from '@terascope/types';
import type {
    Elasticsearch6Params, Elasticsearch7Params,
    Elasticsearch8TypeParams, Elasticsearch8TypeWithBodyParams,
    Opensearch1Params
} from './interfaces';
import type { Semver } from '../interfaces';

export type Elasticsearch6ExistsParams = Elasticsearch6Params.Exists
export type Elasticsearch7ExistsParams = Elasticsearch7Params.Exists
export type Elasticsearch8ExistsParams =
    Elasticsearch8TypeParams.GetRequest
    | Elasticsearch8TypeWithBodyParams.GetRequest;

export type Opensearch1ExistsParams = Opensearch1Params.Exists;
export type GetQueryResponse = Elasticsearch8TypeParams.DeleteByQueryResponse

export type ExistsParams =
    Elasticsearch6ExistsParams
    | Elasticsearch7ExistsParams
    | Elasticsearch8ExistsParams
    | Opensearch1ExistsParams

export function convertExistsParams(
    params: Record<string, any>,
    distribution: ElasticsearchDistribution,
    version: Semver
) {
    const [majorVersion] = version;
    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            const {
                type, parent, _source_exclude,
                _source_include, _source_excludes,
                _source_includes, ...parsedParams
            } = params;

            parsedParams._source_includes = _source_includes ?? _source_include;
            parsedParams._source_excludes = _source_excludes ?? _source_exclude;

            return parsedParams;
        }

        if (majorVersion === 7) {
            const {
                parent, _source_exclude,
                _source_include, _source_excludes,
                _source_includes, ...parsedParams
            } = params;

            parsedParams._source_includes = _source_includes ?? _source_include;
            parsedParams._source_excludes = _source_excludes ?? _source_exclude;

            return parsedParams;
        }

        if (majorVersion === 6) {
            const {
                type = '_doc', _source_exclude,
                _source_include, _source_excludes,
                _source_includes, ...parsedParams
            } = params;

            // this accepts plural and non plural standard, buts its best to be consistent
            parsedParams._source_includes = _source_includes ?? _source_include;
            parsedParams._source_excludes = _source_excludes ?? _source_exclude;
            // make sure that type exists as it is required here
            parsedParams.type = type;

            return parsedParams;
        }

        throw new Error(`unsupported elasticsearch version: ${version.join('.')}`);
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            // parent is from ES6, no use in other versions
            const {
                parent, _source_exclude,
                _source_include, _source_excludes,
                _source_includes, ...parsedParams
            } = params;

            parsedParams._source_includes = _source_includes ?? _source_include;
            parsedParams._source_excludes = _source_excludes ?? _source_exclude;

            return parsedParams;
        }

        throw new Error(`unsupported opensearch version: ${version.join('.')}`);
    }

    throw new Error(`unsupported distribution ${distribution}`);
}

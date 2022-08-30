import { ElasticsearchDistribution } from '@terascope/types';
import type { SearchResult, VersionType } from './interfaces';
import type { Semver } from '../interfaces';

export type GetQueryResponse<T = Record<string, unknown>> = SearchResult<T>

export interface GetParams {
    id: string;
    index: string;
    type?: string;
    stored_fields?: string | string[];
    preference?: string;
    realtime?: boolean;
    refresh?: boolean;
    routing?: string;
    _source?: string | string[];
    _source_excludes?: string | string[];
    _source_includes?: string | string[];
    version?: number;
    version_type?: VersionType;
}

export function convertGetParams(
    params: Record<string, any>,
    distribution: ElasticsearchDistribution,
    version: Semver
) {
    const [majorVersion] = version;
    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            const {
                type, ...parsedParams
            } = params;

            return parsedParams;
        }

        if (majorVersion === 7) {
            return params;
        }

        if (majorVersion === 6) {
            const {
                type = '_doc', ...parsedParams
            } = params;

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

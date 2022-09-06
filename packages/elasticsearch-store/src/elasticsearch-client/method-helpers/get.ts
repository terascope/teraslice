import { ElasticsearchDistribution } from '@terascope/types';
import type { SearchResult, VersionType } from './interfaces';
import type { DistributionMetadata } from '../interfaces';

export type GetResponse<T = Record<string, unknown>> = SearchResult<T>

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
    distributionMeta: DistributionMetadata
) {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

    const {
        type = '_doc',
        ...parsedParams
    } = params;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8 || majorVersion === 7) return parsedParams;

        if (majorVersion === 6) {
            return {
                type,
                ...parsedParams
            };
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            return parsedParams;
        }
    }

    throw new Error(`Unsupported ${distribution} version ${version}`);
}

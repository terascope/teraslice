import { ElasticsearchDistribution } from '@terascope/types';
import type { TimeSpan, ExpandWildcards } from './interfaces';
import type { Semver } from '../interfaces';

export interface IndicesDeleteParams {
    index: string | string[];
    timeout?: TimeSpan;
    master_timeout?: TimeSpan;
    ignore_unavailable?: boolean;
    allow_no_indices?: boolean;
    expand_wildcards?: ExpandWildcards
}

export interface IndicesDeleteResponse {
    acknowledged: boolean
}

export function convertIndicesDeleteParams(
    params: IndicesDeleteParams,
    distribution: ElasticsearchDistribution,
    version: Semver
) {
    const [majorVersion] = version;
    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if ([6, 7, 8].includes(majorVersion)) return params;
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            return params;
        }
    }

    throw new Error(`unsupported ${distribution} version: ${distribution}`);
}

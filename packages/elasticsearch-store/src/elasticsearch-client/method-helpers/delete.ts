import { ElasticsearchDistribution } from '@terascope/types';
import type { WriteResponseBase, VersionType } from './interfaces';
import type { DistributionMetadata } from '../interfaces';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DeleteResponse extends WriteResponseBase {}

export interface DeleteParams {
    id: string;
    index: string;
    type?: string;
    if_primary_term?: number;
    if_seq_no?: number;
    refresh?: 'true' | 'false' | 'wait_for';
    routing?: string;
    timeout?: string | number;
    version?: number;
    version_type?: VersionType;
    wait_for_active_shards?: number | 'all'
}

export function convertDeleteParams(
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
        if (majorVersion === 8 || majorVersion === 7) {
            return parsedParams;
        }

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

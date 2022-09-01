import { ElasticsearchDistribution } from '@terascope/types';
import type { DistributionMetadata } from '../interfaces';

export interface ClusterGetSettingsParams {
    flat_settings?: boolean
    include_defaults?: boolean
    timeout?: string | number;
}

export interface ClusterGetSettingsResponse {
    persistent: Record<string, any>;
    transient: Record<string, any>;
    defaults?: Record<string, any>;
}

export function convertClusterSettingsParams(
    params: ClusterGetSettingsParams,
    distributionMeta: DistributionMetadata,
) {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if ([6, 7, 8].includes(majorVersion)) {
            return params;
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            return params;
        }
    }

    throw new Error(`Unsupported ${distribution} version ${version}`);
}

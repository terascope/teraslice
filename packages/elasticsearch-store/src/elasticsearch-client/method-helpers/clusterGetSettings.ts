import { ElasticsearchDistribution } from '@terascope/types';
import type { Semver } from '../interfaces';

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
    distribution: ElasticsearchDistribution,
    version: Semver
) {
    const [majorVersion] = version;
    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            // make sure to remove type
            return params;
        }

        if (majorVersion === 7) {
            return params;
        }

        if (majorVersion === 6) {
            return params;
        }

        throw new Error(`Unsupported elasticsearch version: ${version.join('.')}`);
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            return params;
        }

        throw new Error(`Unsupported opensearch version: ${version.join('.')}`);
    }

    throw new Error(`Unsupported distribution ${distribution}`);
}

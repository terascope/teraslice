import { ElasticsearchDistribution } from '@terascope/types';
import type { Semver } from '../interfaces';

export interface ExistsParams {
    id: string;
    index: string;
    type?: string;
    preference?: string;
    realtime?: boolean;
    refresh?: boolean;
    routing?: string;
}

export function convertExistsParams(
    params: ExistsParams,
    distribution: ElasticsearchDistribution,
    version: Semver
) {
    const [majorVersion] = version;
    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            delete params.type;

            return params;
        }

        if (majorVersion === 7) {
            return params;
        }

        if (majorVersion === 6) {
            if (params.type == null) {
                params.type = '_doc';
                // throw new Error('type must be provided for an es 6 query');
            }

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

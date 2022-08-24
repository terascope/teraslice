import { ElasticsearchDistribution } from '@terascope/types';
import type { WriteResponseBase, VersionType } from './interfaces';
import type { Semver } from '../interfaces';

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
    distribution: ElasticsearchDistribution,
    version: Semver
) {
    const [majorVersion] = version;
    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            // make sure to remove type
            const {
                type, ...parsedParams
            } = params;

            return parsedParams;
        }

        if (majorVersion === 7) {
            const {
                type, ...parsedParams
            } = params;

            return parsedParams;
        }

        if (majorVersion === 6) {
            const {
                type = '_doc', ...parsedParams
            } = params;
            // ES6 version requires a type to be set
            parsedParams.type = type;
            return parsedParams;
        }

        throw new Error(`Unsupported elasticsearch version: ${version.join('.')}`);
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            const {
                type, ...parsedParams
            } = params;

            return parsedParams;
        }

        throw new Error(`Unsupported opensearch version: ${version.join('.')}`);
    }

    throw new Error(`Unsupported distribution ${distribution}`);
}

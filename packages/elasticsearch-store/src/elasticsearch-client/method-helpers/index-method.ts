import { ElasticsearchDistribution } from '@terascope/types';
import {
    IndexRefresh, VersionType, WriteResponseBase,
    WaitForActiveShards, OpType
} from './interfaces';
import type { Semver } from '../interfaces';

export interface IndexParams<TDocument = unknown> {
    id?: string;
    index: string;
    type?: string;
    op_type?: OpType;
    refresh?: IndexRefresh;
    routing?: string;
    timeout?: string | number;
    version?: number;
    version_type?: VersionType;
    wait_for_active_shards?: WaitForActiveShards;
    body?: TDocument;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IndexResponse extends WriteResponseBase {}

export function convertIndexParams(
    params: IndexParams,
    distribution: ElasticsearchDistribution,
    version: Semver
) {
    const [majorVersion] = version;
    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            // make sure to remove type
            const {
                type, body, ...parsedParams
            } = params;
            // ES8 does not have body
            return {
                document: body,
                ...parsedParams
            };
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
            // @ts-ignore type is required in v6 query
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

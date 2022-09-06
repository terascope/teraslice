import { ElasticsearchDistribution } from '@terascope/types';
import {
    ensureNoTypeInMapping,
    ensureTypeInMapping
} from './helper-utils';
import type {
    TimeSpan,
    WaitForActiveShards,
    IndexTemplateProperties
} from './interfaces';
import type { DistributionMetadata } from '../interfaces';

export interface IndicesCreateParams {
    index: string;
    include_type_name?: boolean;
    wait_for_active_shards?: WaitForActiveShards;
    timeout?: TimeSpan;
    master_timeout?: TimeSpan;
    body?: IndexTemplateProperties;
}

export interface IndicesCreateResponse {
    acknowledged: boolean;
    shards_acknowledged: boolean;
    index: string;
}

export function convertIndicesCreateParams(
    params: IndicesCreateParams,
    distributionMeta: DistributionMetadata
) {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            const {
                include_type_name,
                body,
                ...parsedParams
            } = params;

            return {
                aliases: body?.aliases,
                // ensure no type in mapping
                mappings: ensureNoTypeInMapping(body?.mappings),
                settings: body?.settings,
                ...parsedParams
            };
        }

        if (majorVersion === 7) {
            return params;
        }

        if (majorVersion === 6) {
            const {
                body,
                include_type_name,
                ...parsedParams
            } = params;

            return {
                include_type_name: true,
                body: ensureTypeInMapping(body),
                ...parsedParams
            };
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            return params;
        }
    }

    throw new Error(`unsupported ${distribution} version: ${version}`);
}

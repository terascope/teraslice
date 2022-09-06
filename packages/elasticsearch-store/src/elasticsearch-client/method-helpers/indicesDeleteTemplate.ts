import { ElasticsearchDistribution } from '@terascope/types';
import type { TimeSpan } from './interfaces';
import type { DistributionMetadata } from '../interfaces';

export interface IndicesDeleteTemplateParams {
    name: string;
    master_timeout?: TimeSpan;
}

export interface IndicesDeleteTemplateResponse {
    acknowledged: boolean
}

export function convertIndicesDeleteTemplateParams(
    params: IndicesDeleteTemplateParams,
    distributionMeta: DistributionMetadata
) {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if ([6, 7, 8].includes(majorVersion)) return params;
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            return params;
        }
    }

    throw new Error(`unsupported ${distribution} version: ${version}`);
}

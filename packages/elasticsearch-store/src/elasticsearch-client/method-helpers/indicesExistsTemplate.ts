import { ElasticsearchDistribution } from '@terascope/types';
import { TimeSpan } from './interfaces';
import type { DistributionMetadata } from '../interfaces';

export interface IndicesExistsTemplateParams {
    name: string | string[];
    flat_settings?: boolean;
    master_timeout?: TimeSpan;
    local?: boolean;
}

export type IndicesExistsTemplateResponse = boolean;

export function convertIndicesExistsTemplateParams(
    params: IndicesExistsTemplateParams,
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
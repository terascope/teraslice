import { ElasticsearchDistribution } from '@terascope/types';
import { TimeSpan, IndexTemplateProperties } from './interfaces';
import type { DistributionMetadata } from '../interfaces';

export interface IndicesGetTemplateParams {
    name?: string | string[];
    include_type_name?: boolean;
    flat_settings?: boolean;
    master_timeout?: TimeSpan;
    local?: boolean;
}

export interface IndicesGetTemplateResponse {
    [template: string]: TemplateBody;
}

interface TemplateBody extends IndexTemplateProperties {
    version?: number;
    order?: number;
}

export function convertIndicesGetTemplateParams(
    params: IndicesGetTemplateParams,
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

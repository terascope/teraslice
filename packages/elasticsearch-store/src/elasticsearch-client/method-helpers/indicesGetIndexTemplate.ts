import { ElasticsearchDistribution } from '@terascope/types';
import { TimeSpan, Alias } from './interfaces';
import type { DistributionMetadata } from '../interfaces';

export interface IndicesGetIndexTemplateParams {
    name?: string | string[];
    include_type_name?: boolean;
    flat_settings?: boolean;
    master_timeout?: TimeSpan;
    local?: boolean;
}

export interface IndicesGetIndexTemplateResponse {
    index_templates: IndexTemplate[];
}

interface IndexTemplate {
    name: string,
    index_template: {
        index_patterns: string[];
        settings: { index: Record<string, any> };
        mappings: Record<string, any>,
        aliases: Alias
    }
}

export function convertIndicesGetIndexTemplateParams(
    params: IndicesGetIndexTemplateParams,
    distributionMeta: DistributionMetadata
) {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if ([7, 8].includes(majorVersion)) return params;
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            return params;
        }
    }

    throw new Error(`unsupported ${distribution} version: ${version}`);
}

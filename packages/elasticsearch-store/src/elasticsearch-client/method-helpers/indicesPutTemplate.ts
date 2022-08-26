import { ElasticsearchDistribution } from '@terascope/types';
import type { TimeSpan, IndexTemplateProperties } from './interfaces';
import type { Semver } from '../interfaces';

export interface IndicesPutTemplateParams {
    name: string;
    include_type_name?: boolean;
    order?: number;
    create?: boolean;
    master_timeout?: TimeSpan;
    body: IndexTemplateProperties

    // aliases?: Record<IndexName, IndicesAlias>;
    // index_patterns?: string | string[];
    // mappings?: MappingTypeMapping;
    // settings?: Record<string, any>;
    // version?: VersionNumber;
}

export interface IndicesPutTemplateResponse {
    acknowledged: boolean
}

export function convertIndicesDeleteTemplateParams(
    params: IndicesPutTemplateParams,
    distribution: ElasticsearchDistribution,
    version: Semver
) {
    const [majorVersion] = version;
    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majoreVersion === 8) {

        }

        if ([6, 7].includes(majorVersion)) return params;
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            return params;
        }
    }

    throw new Error(`unsupported ${distribution} version: ${distribution}`);
}

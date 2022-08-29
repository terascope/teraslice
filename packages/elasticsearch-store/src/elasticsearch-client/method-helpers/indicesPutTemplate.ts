import { ElasticsearchDistribution } from '@terascope/types';
import { ensureNoTypeInMapping, ensureTypeInMapping } from './helper-utils';
import type { TimeSpan, IndexTemplateProperties } from './interfaces';
import type { Semver } from '../interfaces';

export interface IndicesPutTemplateParams {
    name: string;
    include_type_name?: boolean;
    order?: number;
    create?: boolean;
    master_timeout?: TimeSpan;
    body: IndexTemplateProperties
}

export interface IndicesPutTemplateResponse {
    acknowledged: boolean
}

export function convertIndicesPutTemplateParams(
    params: IndicesPutTemplateParams,
    distribution: ElasticsearchDistribution,
    version: Semver
) {
    const [majorVersion] = version;
    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            const {
                body,
                include_type_name,
                ...parsedParams
            } = params;

            return {
                index_patterns: body.index_patterns,
                aliases: body.aliases,
                mappings: ensureNoTypeInMapping(body.mappings),
                settings: body.settings,
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

    throw new Error(`unsupported ${distribution} version: ${distribution}`);
}

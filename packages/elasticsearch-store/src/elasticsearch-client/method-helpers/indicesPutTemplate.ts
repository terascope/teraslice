import { ElasticsearchDistribution, ClientParams, ClientMetadata } from '@terascope/types';

import { ensureNoTypeInMapping, ensureTypeInMapping } from './helper-utils';

export function convertIndicesPutTemplateParams(
    params: ClientParams.IndicesPutTemplateParams,
    distributionMeta: ClientMetadata
) {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            const {
                body,
                include_type_name,
                ...parsedParams
            } = params;

            return {
                index_patterns: body?.index_patterns,
                aliases: body?.aliases,
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

        if (majorVersion === 2) {
            const {
                include_type_name,
                master_timeout,
                ...parsedParams
            } = params;

            return {
                cluster_manager_timeout: master_timeout,
                ...parsedParams
            };
        }
    }

    throw new Error(`unsupported ${distribution} version: ${version}`);
}

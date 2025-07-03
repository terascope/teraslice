import { ElasticsearchDistribution, ClientParams, ClientMetadata } from '@terascope/types';
import { ensureNoTypeInMapping, ensureTypeInMapping } from './helper-utils.js';

export function convertIndicesCreateParams(
    params: ClientParams.IndicesCreateParams,
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

        if (majorVersion === 2 || majorVersion === 3) {
            const {
                include_type_name,
                master_timeout,
                body,
                ...parsedParams
            } = params;

            const newBody = {
                ...body,
                mappings: ensureNoTypeInMapping(body?.mappings),
            };

            return {
                ...parsedParams,
                body: newBody,
                ...(master_timeout !== undefined && { cluster_manager_timeout: master_timeout }),
            };
        }
    }

    throw new Error(`unsupported ${distribution} version: ${version}`);
}

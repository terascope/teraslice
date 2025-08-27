import { ElasticsearchDistribution, ClientParams, ClientMetadata } from '@terascope/types';
import { get, isNumber } from '@terascope/utils';
import { ensureNoTypeInMapping } from './helper-utils.js';

export function convertIndicesPutTemplateParams(
    params: ClientParams.IndicesPutTemplateParams,
    distributionMeta: ClientMetadata
) {
    const {
        majorVersion,
        distribution,
        version,
    } = distributionMeta;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            const {
                body,
                ...parsedParams
            } = params;

            const indexSchemaVersion = get(body, 'version');

            return {
                index_patterns: body?.index_patterns,
                aliases: body?.aliases,
                mappings: ensureNoTypeInMapping(body?.mappings),
                settings: body?.settings,
                ...isNumber(indexSchemaVersion) && { version: indexSchemaVersion },
                ...parsedParams
            };
        }

        if (majorVersion === 7) {
            return params;
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            return params;
        }

        if (majorVersion === 2 || majorVersion === 3) {
            const {
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

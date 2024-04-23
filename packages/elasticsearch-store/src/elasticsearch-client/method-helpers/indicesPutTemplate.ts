import { ElasticsearchDistribution, ClientParams, ClientMetadata } from '@terascope/types';

import { ensureNoTypeInMapping, ensureTypeInMapping } from './helper-utils';

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
                include_type_name,
                ...parsedParams
            } = params;

            // console.log('===c', {
            //     index_patterns: body?.index_patterns,
            //     aliases: body?.aliases,
            //     mappings: ensureNoTypeInMapping(body?.mappings),
            //     settings: body?.settings,
            //     _meta: (body as any)?._meta,
            //     ...parsedParams
            // });

            return {
                index_patterns: body?.index_patterns,
                aliases: body?.aliases,
                mappings: ensureNoTypeInMapping(body?.mappings),
                settings: body?.settings,
                // _meta: (body as any)?._meta,
                ...parsedParams
            };
        }

        if (majorVersion === 7) {
            console.log('===7parm', params);
            // if (params.body?.mappings?._meta && !params?.body?.mappings?.properties) {
            //     (params.body as any).mappings = {};
            //     (params.body as any).mappings.properties = {};
            //     (params.body as any).mappings._meta = { ...params.body?.mappings?._meta };
            //     delete params.body.mappings._meta;
            // }
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

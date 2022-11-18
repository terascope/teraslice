import { ElasticsearchDistribution, ClientParams, ClientMetadata } from '@terascope/types';

export function convertSearchParams(
    params: ClientParams.SearchParams,
    distributionMeta: ClientMetadata
) {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

    const {
        type,
        ...parsedParams
    } = params;

    // includesExcludes(parsedParams);
    qDependentFieldsCheck(parsedParams);

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8 || majorVersion === 7) {
            return parsedParams;
        }

        if (majorVersion === 6) {
            return {
                ...(type !== undefined && { type }),
                ...parsedParams
            };
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            return parsedParams;
        }
    }

    throw new Error(`Unsupported ${distribution} version ${version}`);
}

function qDependentFieldsCheck(params: ClientParams.SearchParams) {
    const requiresQ = [
        'analyzer',
        'analyze_wildcard',
        'default_operator',
        'df',
        'lenient'
    ];

    const hasQDependentFields = requiresQ.filter((field) => params[field] != null);

    if (hasQDependentFields.length && params.q == null) {
        throw new Error(`${hasQDependentFields.join(', ')} requires q parameter`);
    }
}

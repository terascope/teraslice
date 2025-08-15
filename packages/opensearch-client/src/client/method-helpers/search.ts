import { ElasticsearchDistribution, ClientParams, ClientMetadata } from '@terascope/types';
import { isNumber, isNotNil } from '@terascope/utils';

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
        track_total_hits,
        ...parsedParams
    } = params;

    // includesExcludes(parsedParams);
    qDependentFieldsCheck(parsedParams);
    const hasTotalConfig = isNotNil(track_total_hits);
    let trackTotal = track_total_hits;

    if (!hasTotalConfig) {
        trackTotal = true;
    }

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8 || majorVersion === 7) {
            return {
                ...parsedParams,
                track_total_hits: trackTotal,
            };
        }

        if (majorVersion === 6) {
            if (hasTotalConfig && isNumber(track_total_hits)) {
                trackTotal = true;
            }

            return {
                ...(type !== undefined && { type }),
                ...parsedParams,
                ...hasTotalConfig && { track_total_hits: trackTotal }
            };
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if ([1, 2, 3].includes(majorVersion)) {
            return {
                ...parsedParams,
                track_total_hits: trackTotal,
            };
        }
    }

    throw new Error(`Unsupported ${distribution} version ${version}`);
}

function qDependentFieldsCheck(params: ClientParams.SearchParams) {
    const requiresQ: Array<keyof ClientParams.SearchParams> = [
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

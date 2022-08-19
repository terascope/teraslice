import { ElasticsearchDistribution } from '@terascope/types';
import type { Semver } from '../interfaces';
import { SearchParams } from './interfaces';

export function convertSearchParams(
    params: SearchParams,
    distribution: ElasticsearchDistribution,
    version: Semver
) {
    const [majorVersion] = version;

    qDependentFieldsCheck(params);

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            if (params.type) delete params.type;

            return params;
        }

        if (majorVersion === 7 || majorVersion === 6) {
            return params;
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            return params;
        }
    }

    throw new Error(`${distribution} version ${version} is not supported`);
}

function qDependentFieldsCheck(params: SearchParams) {
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

import { ElasticsearchDistribution, ClientParams, ClientMetadata } from '@terascope/types';

export function convertTasksListParams(
    params: ClientParams.TasksListParams,
    distributionMeta: ClientMetadata
) {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if ([6, 7, 8].includes(majorVersion)) {
            return params;
        }
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if ([1, 2, 3].includes(majorVersion)) {
            return params;
        }
    }

    throw new Error(`unsupported ${distribution} version: ${version}`);
}

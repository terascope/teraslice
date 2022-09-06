import { ElasticsearchDistribution } from '@terascope/types';
import type { DistributionMetadata } from '../interfaces';

export interface TasksCancelParams {
    task_id?: string | number;
    actions?: string | string[];
    nodes?: string[];
    parent_task_id?: string;
    wait_for_completion?: boolean;
}

export interface TasksCancelResponse {
    node_failures?: Record<string, any>[];
    task_failures?: Record<string, any>[];
    nodes?: Record<string, any>;
    tasks?: Record<string, any>;
}

export function convertTasksCancelParams(
    params: TasksCancelParams,
    distributionMeta: DistributionMetadata,
) {
    const {
        majorVersion,
        distribution,
        version
    } = distributionMeta;

    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if ([6, 7, 8].includes(majorVersion)) return params;
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            return params;
        }
    }

    throw new Error(`unsupported ${distribution} version: ${version}`);
}

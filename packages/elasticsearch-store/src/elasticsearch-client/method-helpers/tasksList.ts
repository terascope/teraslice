import { ElasticsearchDistribution } from '@terascope/types';
import type {
    TimeSpan
} from './interfaces';
import type { DistributionMetadata } from '../interfaces';

export interface TasksListParams {
    nodes?: string | string[];
    actions?: string | string[];
    detailed?: boolean;
    parent_task_id?: string;
    wait_for_completion?: boolean;
    node_id?: string[];
    group_by?: 'nodes' | 'parents' | 'none';
    timeout?: TimeSpan;
}

export interface TasksListResponse {
    node_failures?: Record<string, any>[];
    task_failures?: {
        task_id: number;
        node_id: string;
        status: string;
        reason: Record<string, any>;
    }[];
    nodes?: Record<string, any>;
    tasks?: Record<string, any>;
}

export function convertTasksListParams(
    params: TasksListParams,
    distributionMeta: DistributionMetadata
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

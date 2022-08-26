import { ElasticsearchDistribution } from '@terascope/types';
import type {
    TimeSpan
} from './interfaces';
import type { Semver } from '../interfaces';

export interface TasksGetParams {
    task_id: string | number;
    timeout?: TimeSpan;
    wait_for_completion?: boolean;
}

export interface TasksGetResponse {
    completed: boolean;
    task: Record<string, any>;
    response?: Record<string, any>;
    error?: Record<string, any>;
}

export function convertTasksGetParams(
    params: TasksGetParams,
    distribution: ElasticsearchDistribution,
    version: Semver
) {
    const [majorVersion] = version;
    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if ([6, 7, 8].includes(majorVersion)) return params;
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            return params;
        }
    }

    throw new Error(`unsupported ${distribution} version: ${distribution}`);
}

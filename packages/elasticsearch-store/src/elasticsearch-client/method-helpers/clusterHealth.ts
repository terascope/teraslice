import { ElasticsearchDistribution } from '@terascope/types';
import { Health } from './interfaces';
import type { Semver } from '../interfaces';

export interface ClusterHealthParams {
    index?: string | string[];
    level?: 'cluster' | 'indices' | 'shards';
    local?: boolean;
    master_timeout?: string;
    timeout?: string;
    wait_for_active_shards?: string;
    wait_for_nodes?: string;
    wait_for_events?: 'immediate' | 'urgent' | 'high' | 'normal' | 'low' | 'languid';
    wait_for_no_relocating_shards?: boolean;
    wait_for_no_initializing_shards?: boolean;
    wait_for_status?: Health
}

export interface ClusterHealthShardHealthStats {
    active_shards: number;
    initializing_shards: number;
    primary_active: boolean;
    relocating_shards: number;
    status: Health;
    unassigned_shards: number;
}

export interface ClusterHealthIndexHealthStats {
    active_primary_shards: number;
    active_shards: number;
    initializing_shards: number;
    number_of_replicas: number;
    number_of_shards: number;
    relocating_shards: number;
    shards?: Record<string, ClusterHealthShardHealthStats>;
    status: Health;
    unassigned_shards: number;
}

export interface ClusterHealthResponse {
    active_primary_shards: number;
    active_shards: number;
    active_shards_percent_as_number: string | number;
    cluster_name: string;
    delayed_unassigned_shards: number;
    indices?: Record<string, ClusterHealthIndexHealthStats>;
    initializing_shards: number;
    number_of_data_nodes: number;
    number_of_in_flight_fetch: number;
    number_of_nodes: number;
    number_of_pending_tasks: number;
    relocating_shards: number;
    status: Health;
    task_max_waiting_in_queue_millis: string | number;
    timed_out: boolean;
    unassigned_shards: number;
}

export function convertClusterHealthParams(
    params: ClusterHealthParams,
    distribution: ElasticsearchDistribution,
    version: Semver
) {
    const [majorVersion] = version;
    if (distribution === ElasticsearchDistribution.elasticsearch) {
        if (majorVersion === 8) {
            return params;
        }

        if (majorVersion === 7) {
            return params;
        }

        if (majorVersion === 6) {
            const {
                master_timeout,
                ...parsedParams
            } = params;

            return parsedParams;
        }

        throw new Error(`Unsupported elasticsearch version: ${version.join('.')}`);
    }

    if (distribution === ElasticsearchDistribution.opensearch) {
        if (majorVersion === 1) {
            const {
                master_timeout,
                ...parsedParams
            } = params;

            if (master_timeout) {
                // @ts-expect-error, master_timeout is deprecated
                parsedParams.cluster_manager_timeout = master_timeout;
            }

            return parsedParams;
        }
        // future version will have master_timeout gone, renamed to cluster_manager_timeout
        throw new Error(`Unsupported opensearch version: ${version.join('.')}`);
    }

    throw new Error(`Unsupported distribution ${distribution}`);
}

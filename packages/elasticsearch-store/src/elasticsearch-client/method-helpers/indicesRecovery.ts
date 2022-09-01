import { ElasticsearchDistribution } from '@terascope/types';
import type { DistributionMetadata } from '../interfaces';

export interface IndicesRecoveryParams {
    index?: string | string[];
    active_only?: boolean;
    detailed?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IndicesRecoveryResponse
    extends DictionaryResponseBase<IndicesRecoveryRecoveryStatus> { }

export interface DictionaryResponseBase<TValue = unknown> {
    [key: string]: TValue;
}

export interface IndicesRecoveryRecoveryStatus {
    shards: IndicesRecoveryShardRecovery[];
}

export interface IndicesRecoveryRecoveryBytes {
    percent: string | number;
    recovered?: string | number;
    recovered_in_bytes: string | number;
    reused?: string | number;
    reused_in_bytes: string | number;
    total?: string | number;
    total_in_bytes: string | number;
}

export interface IndicesRecoveryRecoveryFiles {
    details?: IndicesRecoveryFileDetails[];
    percent: string | number;
    recovered: number;
    reused: number;
    total: number;
}

export interface IndicesRecoveryFileDetails {
    length: number;
    name: string;
    recovered: number;
}

export interface IndicesRecoveryRecoveryIndexStatus {
    bytes?: IndicesRecoveryRecoveryBytes;
    files: IndicesRecoveryRecoveryFiles;
    size: IndicesRecoveryRecoveryBytes;
    source_throttle_time?:string | number;
    source_throttle_time_in_millis: string | number;
    target_throttle_time?:string | number;
    target_throttle_time_in_millis: string | number;
    total_time_in_millis: string | number;
    total_time?:string | number;
}

export interface IndicesRecoveryShardRecovery {
    id: number;
    index: IndicesRecoveryRecoveryIndexStatus;
    primary: boolean;
    source: IndicesRecoveryRecoveryOrigin;
    stage: string;
    start?: IndicesRecoveryRecoveryStartStatus;
    start_time?: string;
    start_time_in_millis: string | number;
    stop_time?: string;
    stop_time_in_millis: string | number;
    target: IndicesRecoveryRecoveryOrigin;
    total_time?: string;
    total_time_in_millis: string | number;
    translog: IndicesRecoveryTranslogStatus;
    type: string;
    verify_index: IndicesRecoveryVerifyIndex;
}

export interface IndicesRecoveryRecoveryOrigin {
    hoststring?: string;
    host?: string;
    transport_address?: string;
    id?: string;
    ip?: string;
    string?: string;
    bootstrap_new_history_string?: boolean;
    repository?: string;
    snapshot?: string;
    version?: string;
    restorestring?: string;
    index?: string;
}

export interface IndicesRecoveryVerifyIndex {
    check_index_time?:string | number;
    check_index_time_in_millis: string | number;
    total_time?:string | number;
    total_time_in_millis: string | number;
}

export interface IndicesRecoveryTranslogStatus {
    percent: string | number;
    recovered: number;
    total: number;
    total_on_start: number;
    total_time?: string;
    total_time_in_millis: string | number;
}

export interface IndicesRecoveryRecoveryStartStatus {
    check_index_time: number;
    total_time_in_millis: string;
}

export function convertIndicesRecoveryParams(
    params: IndicesRecoveryParams,
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

    throw new Error(`Unsupported ${distribution} version ${version}`);
}

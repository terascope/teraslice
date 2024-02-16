import {
    ExecutionStatus, ClusterManagerType
} from './base.js';

export interface JobCreate {
    job_id: string;
    ex_id?: string;
}

export interface Paused {
    status: ExecutionStatus.paused;
}

export interface Resume {
    status: ExecutionStatus.running;
}

export interface Stopped {
    status: ExecutionStatus.stopped | ExecutionStatus.stopping;
}

export interface ChangeWorkerResponse {
    message: string;
}

export interface ExecutionIDResponse {
    ex_id: string;
}

export interface AssetStatusResponse {
    available: boolean;
}

export type AssetIDResponse = {
    _id: string;
}

export interface RootResponse {
    arch: string;
    clustering_type: ClusterManagerType;
    name: string;
    node_version: string;
    platform: string;
    teraslice_version: string;
}

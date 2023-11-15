import { Request, Response } from 'express';
import { Logger } from '@terascope/utils';
import { Context, ValidatedJobConfig, RecoveryCleanupType } from '@terascope/job-components';
import type { ExecutionStorage, StateStorage, JobsStorage } from './lib/storage';
import type {
    ExecutionService, JobsService, ApiService,
    ClusterServiceType
} from './lib/cluster/services';

export interface TerasliceRequest extends Request {
    logger: Logger
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TerasliceResponse extends Response {}

export interface ClusterMasterContext extends Context {
    stores: {
        executionStorage: ExecutionStorage;
        stateStorage: StateStorage;
        jobsStorage: JobsStorage
    }
    services: {
        executionService: ExecutionService;
        jobsService: JobsService;
        clusterService: ClusterServiceType;
        apiService: ApiService;
    }
}

export enum ProcessAssignment {
    cluster_master = 'cluster_master',
    assets_service = 'assets_service',
    execution_controller = 'execution_controller',
    worker = 'worker'

}
interface BaseWorkerNode {
    worker_id: number;
    pid: number;
}

export interface WorkerClusterNode extends BaseWorkerNode {
    assignment: ProcessAssignment.cluster_master
}

export interface WorkerAssetNode extends BaseWorkerNode {
    assignment: ProcessAssignment.assets_service
}

export interface WorkerExecutionNode extends BaseWorkerNode {
    assignment: ProcessAssignment.execution_controller;
    ex_id: string;
    job_id: string;
}
export interface WorkerWorkerNode extends BaseWorkerNode {
    assignment: ProcessAssignment.worker;
    ex_id: string;
    job_id: string;
}

export type WorkerNode = WorkerClusterNode
| WorkerAssetNode
| WorkerExecutionNode
| WorkerWorkerNode

// TODO: find out about state
export interface NodeState {
    node_id: string;
    hostname: string;
    pid: number;
    node_version: string;
    teraslice_version: string;
    total: number;
    state: string; // ??
    available: number;
    active: WorkerNode[];
}

export interface JobRecord extends ValidatedJobConfig{
    job_id: string;
    _context: 'job';
    _created: string | Date;
    _updated: string | Date;
}

export interface ExecutionRecord extends ValidatedJobConfig {
    job_id: string;
    ex_id: string;
    _context: 'ex';
    _created: string | Date;
    _updated: string | Date;
    // TODO: fix this
    metadata: Record<string, any>;
    recovered_execution?: string;
    recovered_slice_type?: RecoveryCleanupType;
    _status: string;
    _has_errors: boolean;
    _slicer_stats: Record<string, any>;
    _failureReason: string
    slicer_port?: number;
    slicer_hostname: string;
}

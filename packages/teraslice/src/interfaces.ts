import { Request, Response } from 'express';
import { Logger } from '@terascope/core-utils';
import { Context } from '@terascope/job-components';
import { ExecutionAnalytics } from '@terascope/types';
import type { ExecutionStorage, StateStorage, JobsStorage } from './lib/storage/index.js';
import type {
    ExecutionService, JobsService, ApiService,
    ClusterServiceType
} from './lib/cluster/services/index.js';

/**
 * Every request passes through middleware that attaches `logger` (see ApiService
 * and AssetsService). Declaration merging makes that known to the type system so
 * express `Request` no longer has to be cast to a Teraslice-specific type.
 */
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            logger: Logger;
        }
    }
}

/**
 * Aliases kept for readability at call sites. The `P` generic forwards to
 * express `Request`'s route-params type, so handlers can express typed params
 * (e.g. `TerasliceRequest<{ jobId: string }>`) while defaulting to `any` lets
 * untyped handlers pass without casting.
 */
export type TerasliceRequest<P = any> = Request<P>;

export type TerasliceResponse = Response;

export interface ClusterMasterContext extends Context {
    stores: {
        executionStorage: ExecutionStorage;
        stateStorage: StateStorage;
        jobsStorage: JobsStorage;
    };
    services: {
        executionService: ExecutionService;
        jobsService: JobsService;
        clusterService: ClusterServiceType;
        apiService: ApiService;
    };
}

export enum ProcessAssignment {
    node_master = 'node_master',
    cluster_master = 'cluster_master',
    assets_service = 'assets_service',
    execution_controller = 'execution_controller',
    worker = 'worker'

}

export function isProcessAssignment(value: string): value is ProcessAssignment {
    return value in ProcessAssignment;
}

interface BaseWorkerNode {
    worker_id: number;
    pid: number;
}

export interface ClusterNode extends BaseWorkerNode {
    assignment: ProcessAssignment.cluster_master;
}

export interface AssetNode extends BaseWorkerNode {
    assignment: ProcessAssignment.assets_service;
}

export interface ExecutionNode extends BaseWorkerNode {
    assignment: ProcessAssignment.execution_controller;
    ex_id: string;
    job_id: string;
}
export interface WorkerNode extends BaseWorkerNode {
    assignment: ProcessAssignment.worker;
    ex_id: string;
    job_id: string;
}

export type ProcessNode = ClusterNode
    | AssetNode
    | ExecutionNode
    | WorkerNode;

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
    active: ProcessNode[];
}

export interface WorkProcessNode extends BaseWorkerNode {
    assignment: ProcessAssignment.execution_controller | ProcessAssignment.worker;
    ex_id: string;
    job_id: string;
    node_id: string;
    hostname: string;
}

export interface ClusterState {
    [nodeId: string]: NodeState;
}

export interface ExecutionNodeWorker extends NodeState {
    node_id: string;
    hostname: string;
}

export interface ControllerStats extends ExecutionAnalytics {
    ex_id: string;
    job_id: string;
    name: string;
}

export type MessagingConfigOptions = {
    [assignment in ProcessAssignment]: {
        networkClient: boolean;
        ipcClient: boolean;
    };
};

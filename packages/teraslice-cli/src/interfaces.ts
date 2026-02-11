import yargs from 'yargs';
import { Job } from 'teraslice-client-js';
import { Teraslice } from '@terascope/types';

export type CMD = yargs.CommandModule;

export interface GithubAssetConfig {
    arch: string;
    assetString: string;
    bundle: boolean;
    nodeVersion: string;
    platform: string;
}

export interface JobMetadata {
    id: string;
    api: Job;
    config: Teraslice.JobConfig;
    status: Teraslice.ExecutionStatus | RegisteredStatus;
}

export interface StatusUpdate {
    newStatus?: Teraslice.ExecutionStatus;
    error: boolean;
    errorMessage?: string;
}

export interface JobConfigFile extends Teraslice.JobConfigParams {
    __metadata: {
        cli: {
            cluster: string;
            version: string;
            job_id: string;
            updated: string;
        };
    };
}

export enum RegisteredStatusEnum {
    no_execution = 'no_execution'
}

export type RegisteredStatus = keyof typeof RegisteredStatusEnum;

export type AllStatusTypes = Teraslice.ExecutionStatus | RegisteredStatus;

export type MessageObject = {
    message: string;
    final: boolean;
};

export type Messages = {
    [key in UpdateActions]: MessageObject;
};

export type UpdateActions = 'running' | 'stopping' | 'status' | 'adjust_workers_terminal'
    | 'recover_not_failed' | 'check_for_errors' | 'quick_completed' | 'resuming'
    | 'starting' | 'start_watching' | 'pausing' | 'paused' | 'stopped'
    | 'view' | 'cannot_pause' | 'cannot_stop' | 'deleted' | 'started' | 'restarted' | 'restarting' | 'resumed';

export type Action = 'start' | 'stop' | 'pause' | 'restart' | 'resume';

export type Tense = 'past' | 'present';

// These should match AssetRepositoryKey values from
// @terascope/job-components/src/operation-loader/interfaces.ts
export const OP_TYPES = ['API', 'Fetcher', 'Processor', 'Schema', 'Slicer', 'Observer'] as const;

export type OpTypeTuple = typeof OP_TYPES;
export type OpType = OpTypeTuple[number];

export type PackageManager = 'yarn' | 'npm' | 'pnpm';

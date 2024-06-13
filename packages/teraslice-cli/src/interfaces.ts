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
        }
    }
}

export enum RegisteredStatusEnum {
    no_execution = 'no_execution'
}

export type RegisteredStatus = keyof typeof RegisteredStatusEnum;

export type AllStatusTypes = Teraslice.ExecutionStatus | RegisteredStatus

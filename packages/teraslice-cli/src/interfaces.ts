import yargs from 'yargs';
import {
    Job,
    ExecutionStatus,
    JobConfiguration,
} from 'teraslice-client-js';
import { JobConfig } from '@terascope/job-components';

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
    config: JobConfiguration;
    status: ExecutionStatus | RegisteredStatus;
}

export interface StatusUpdate {
    newStatus?: ExecutionStatus;
    error: boolean;
    errorMessage?: string;
}

export interface JobConfigFile extends JobConfig {
    __metadata: {
        cli: {
            cluster: string;
            version: string;
            job_id: string;
            updated: string;
        }
    }
}

export enum RegisteredStatus {
    no_execution = 'no_execution'
}

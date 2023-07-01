import yargs from 'yargs';
import {
    Job,
    ExecutionStatus,
    JobConfiguration,
} from 'teraslice-client-js';

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
    status: ExecutionStatus;
}

export interface StatusUpdate {
    newStatus?: ExecutionStatus,
    error: boolean,
    errorMessage?: Error
}

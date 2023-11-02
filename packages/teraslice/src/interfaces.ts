import { Request, Response } from 'express';
import { Logger } from '@terascope/utils';
import { Context } from '@terascope/job-components';
import type { ExecutionStorage, StateStorage, JobsStorage } from './lib/storage';

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
        execution: any;
        jobs: any;
        cluster: any;
        api: any;
    }
}

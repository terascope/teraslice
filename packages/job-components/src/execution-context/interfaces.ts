import { OpRunnerAPI, JobRunnerAPI } from '../register-apis';
import { ExecutionContextAPI } from './api';
import {
    Context,
    ExecutionConfig,
    ContextApis,
    SlicerOperationLifeCycle,
    WorkerOperationLifeCycle
} from '../interfaces';

export interface ExecutionContextConfig {
    context: Context;
    executionConfig: ExecutionConfig;
    terasliceOpPath: string;
    assetIds?: string[];
}

export interface SlicerOperations extends Set<SlicerOperationLifeCycle> {}

export interface SlicerContextApis extends ContextApis {
    op_runner: OpRunnerAPI;
    executionContext: ExecutionContextAPI;
    job_runner: JobRunnerAPI;
}

export interface SlicerContext extends Context {
    apis: SlicerContextApis;
}

export interface WorkerOperations extends Set<WorkerOperationLifeCycle> {}

interface WorkerContextApis extends ContextApis {
    op_runner: OpRunnerAPI;
    executionContext: ExecutionContextAPI;
    job_runner: JobRunnerAPI;
}

export interface WorkerContext extends Context {
    apis: WorkerContextApis;
}

export interface EventHandlers {
    [eventName: string]: (...args: any[]) => void;
}

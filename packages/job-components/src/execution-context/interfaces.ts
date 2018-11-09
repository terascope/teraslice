import { OpRunnerAPI, JobRunnerAPI } from '../register-apis';
import { ExecutionContextAPI } from './api';
import {
    Context,
    ExecutionConfig,
    ContextApis,
    SlicerOperationLifeCycle,
    WorkerOperationLifeCycle,
    Assignment
} from '../interfaces';

export interface ExecutionContextConfig {
    context: Context;
    executionConfig: ExecutionConfig;
    terasliceOpPath?: string;
    assetIds?: string[];
}

export interface SlicerOperations extends Set<SlicerOperationLifeCycle> {}

export interface SlicerContextApis extends ContextApis {
    /** Includes an API for getting a client from Terafoundation */
    op_runner: OpRunnerAPI;
    /** Includes an API for getting a opConfig from the job */
    job_runner: JobRunnerAPI;
}

/**
 * SlicerContext includes the type definitions for
 * the APIs available to ExecutionController.
 * This extends the Terafoundation Context.
*/
export interface SlicerContext extends Context {
    apis: SlicerContextApis;
    assignment: Assignment;
}

export interface WorkerOperations extends Set<WorkerOperationLifeCycle> {}

interface WorkerContextApis extends ContextApis {
    /** Includes an API for getting a client from Terafoundation */
    op_runner: OpRunnerAPI;
    /** Includes an API for getting a opConfig from the job */
    job_runner: JobRunnerAPI;
    /** An API for registering and loading the new Job APIs */
    executionContext: ExecutionContextAPI;
}

/**
 * WorkerContext includes the type definitions for
 * the APIs available to Worker.
 * This extends the Terafoundation Context.
*/
export interface WorkerContext extends Context {
    apis: WorkerContextApis;
    assignment: Assignment;
}

/** event handlers that should be cleaned up */
export interface EventHandlers {
    [eventName: string]: (...args: any[]) => void;
}

export interface SlicerMethodRegistry {
    readonly onSliceComplete: Set<number>;
    readonly onSliceDispatch: Set<number>;
    readonly onSliceEnqueued: Set<number>;
    readonly onExecutionStats: Set<number>;
}

export interface WorkerMethodRegistry {
    readonly onSliceInitialized: Set<number>;
    readonly onSliceStarted: Set<number>;
    readonly onSliceFinalizing: Set<number>;
    readonly onSliceFinished: Set<number>;
    readonly onSliceFailed: Set<number>;
    readonly onSliceRetry: Set<number>;
    readonly onOperationStart: Set<number>;
    readonly onOperationComplete: Set<number>;
}

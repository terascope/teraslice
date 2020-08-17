import { DataWindow } from '@terascope/utils';
import {
    Context,
    ExecutionConfig,
    Slice,
    SliceAnalyticsData,
    SlicerOperationLifeCycle,
    WorkerOperationLifeCycle,
    OpAPI,
} from '../interfaces';
import { APICore, OperationAPIType } from '../operations';

export interface ExecutionContextConfig {
    context: Context;
    executionConfig: ExecutionConfig;
    terasliceOpPath?: string;
    assetIds?: string[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SlicerOperations extends Set<SlicerOperationLifeCycle> {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WorkerOperations extends Set<WorkerOperationLifeCycle> {}

/** event handlers that should be cleaned up */
export interface EventHandlers {
    [eventName: string]: (...args: any[]) => void;
}

export interface JobAPIInstance {
    instance: APICore;
    opAPI?: OpAPI;
    type: OperationAPIType;
}

export interface JobAPIInstances {
    [name: string]: JobAPIInstance;
}

export type WorkerStatus = 'initializing' | 'idle' | 'flushing' | 'running' | 'shutdown';
export type SliceStatus = 'starting' | 'started' | 'completed' | 'failed' | 'flushed';

export interface RunSliceResult {
    status: SliceStatus;
    analytics?: SliceAnalyticsData;
    results: DataWindow|DataWindow[];
}

export type WorkerSliceState = {
    status: SliceStatus;
    /** The current operation position */
    position: number;
    slice: Slice;
    analytics?: SliceAnalyticsData;
};

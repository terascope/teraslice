import { DataEntity } from '@terascope/utils';
import {
    Context,
    ExecutionConfig,
    SlicerOperationLifeCycle,
    WorkerOperationLifeCycle,
    SliceAnalyticsData,
    OpAPI,
    Slice,
} from '../interfaces';
import { APICore } from '../operations';

export interface ExecutionContextConfig {
    context: Context;
    executionConfig: ExecutionConfig;
    terasliceOpPath?: string;
    assetIds?: string[];
}

export interface SlicerOperations extends Set<SlicerOperationLifeCycle> {}

export interface WorkerOperations extends Set<WorkerOperationLifeCycle> {}

/** event handlers that should be cleaned up */
export interface EventHandlers {
    [eventName: string]: (...args: any[]) => void;
}

export interface JobAPIInstance {
    instance: APICore;
    opAPI?: OpAPI;
    type: 'api' | 'observer';
}

export interface JobAPIInstances {
    [name: string]: JobAPIInstance;
}

export type WorkerStatus = 'initializing' | 'idle' | 'flushing' | 'running' | 'shutdown';
export type SliceStatus = 'starting' | 'started' | 'completed' | 'failed' | 'flushed';

export interface RunSliceResult {
    status: SliceStatus;
    analytics?: SliceAnalyticsData;
    results: DataEntity[];
}

export type WorkerSliceState = {
    status: SliceStatus;
    slice: Slice;
    analytics?: SliceAnalyticsData;
};

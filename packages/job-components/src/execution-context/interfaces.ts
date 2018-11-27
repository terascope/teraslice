import {
    Context,
    ExecutionConfig,
    SlicerOperationLifeCycle,
    WorkerOperationLifeCycle,
    SliceAnalyticsData
} from '../interfaces';
import { DataEntity } from '../operations';

export interface ExecutionContextConfig {
    context: Context;
    executionConfig: ExecutionConfig;
    terasliceOpPath?: string;
    assetIds?: string[];
}

export interface SlicerOperations extends Set<SlicerOperationLifeCycle> {}

export interface WorkerOperations extends Set<WorkerOperationLifeCycle> {}

export interface RunSliceResult {
    analytics?: SliceAnalyticsData;
    results: DataEntity[];
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

import {
    Context,
    ExecutionConfig,
    SlicerOperationLifeCycle,
    WorkerOperationLifeCycle,
    SliceAnalyticsData,
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

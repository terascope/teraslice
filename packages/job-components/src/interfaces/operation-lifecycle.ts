import { DataEntity } from '@terascope/entity-utils';
import { Teraslice } from '@terascope/types';
import {
    SlicerRecoveryData, SliceResult, ExecutionStats
} from './operations.js';

export interface OperationLifeCycle {
    /**
     * Called during execution initialization,
     * when this is called perform any async setup.
     */
    initialize(initConfig?: any): Promise<void>;

    /**
     * Called during execution shutdown,
     * when this is cleanup any open connections or destroy any in-memory state.
     */
    shutdown(): Promise<void>;
}

export interface WorkerOperationLifeCycle extends OperationLifeCycle {
    /**
     * Called after a slice is initializated, but before the slice
     * has been handed to any operation.
     */
    onSliceInitialized?(sliceId: string): Promise<void>;

    /**
     * Called after a the slice is sent to the "Fetcher"
     */
    onSliceStarted?(sliceId: string): Promise<void>;

    /**
     * Called after a slice is done with the last operation in the execution
     */
    onSliceFinalizing?(sliceId: string): Promise<void>;

    /**
     * Called after the slice has been acknowledged by the "Execution Controller"
     */
    onSliceFinished?(sliceId: string): Promise<void>;

    /**
     * Called after the slice has been marked as "Failed"
     */
    onSliceFailed?(sliceId: string): Promise<void>;

    /**
     * Called after the operation failed to process the slice
     * but before the slice is retried.
     *
     * **NOTE:** A retry can be stopped by throw an error inside this function
     */
    onSliceRetry?(sliceId: string): Promise<void>;

    /**
     * Called immediately before an operation is started
     *
     * @param sliceId is the id of the slice being processed
     * @param index the index to the operation which completed
     * @param processed is the number of records returned from the op
     */
    onOperationStart?(sliceId: string, index: number): void;

    /**
     * Called immediately after an operation has ended
     *
     * @param sliceId is the id of the slice being processed
     * @param index the index to the operation which completed
     * @param processed is the number of records returned from last op
     * @param results the records returned from last op
     */
    onOperationComplete?(
        sliceId: string,
        index: number,
        processed: number,
        records: DataEntity[]
    ): void;

    /**
     * Called to notify the processors that the next slice being
     * passed through will be an empty slice used to flush
     * any additional in-memory state.
     */
    onFlushStart?(sliceId: string): Promise<void>;

    /**
     * Called to notify the processors that the slice is finished being flushed
     * (shutdown will likely be called immediately afterwards)
     */
    onFlushEnd?(sliceId: string): Promise<void>;
}

export interface SlicerOperationLifeCycle extends OperationLifeCycle {
    /**
     * Called during execution initialization,
     * when this is cleanup any open connections or cleanup any in-memory state.
     *
     * @param recoveryData is the data to recover from (one for each slicer)
     */
    initialize(recoveryData?: SlicerRecoveryData[]): Promise<void>;

    /**
     * A method called by the "Execution Controller" to give a "Slicer"
     * the opportunity to track the slices enqueued by the execution controller
     */
    onSliceEnqueued?(slice: Teraslice.Slice): void;

    /**
     * A method called by the "Execution Controller" to give a "Slicer"
     * the opportunity to track the slices disptached by the execution controller
     */
    onSliceDispatch?(slice: Teraslice.Slice): void;

    /**
     * A method called by the "Execution Controller" to give a "Slicer"
     * the opportunity to track the slices completed by the execution controller
     */
    onSliceComplete?(result: SliceResult): void;

    /**
     * A method called by the "Execution Controller" to give a "Slicer"
     * the opportunity to track various slicer satistics
     */
    onExecutionStats?(stats: ExecutionStats): void;
}

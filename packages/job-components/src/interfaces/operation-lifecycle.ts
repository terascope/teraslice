import { Slice, SliceResult, ExecutionStats } from './operations';

export interface OperationLifeCycle {
     /**
     * Called during execution initialization
    */
    initialize(initConfig?: any): Promise<void>;

    /**
     * Called during execution shutdown
    */
    shutdown(): Promise<void>;
}

export interface WorkerOperationLifeCycle extends OperationLifeCycle {
    /**
     * Called after a slice is initializated, but before the slice
     * has been handed to any operation.
    */
    onSliceInitialized(sliceId: string): Promise<void>;

    /**
     * Called after a the slice is sent to the "Fetcher"
    */
    onSliceStarted(sliceId: string): Promise<void>;

    /**
     * Called after a slice is done with the last operation in the execution
    */
    onSliceFinalizing(sliceId: string): Promise<void>;

    /**
     * Called after the slice has been acknowledged by the "Execution Controller"
    */
    onSliceFinished(sliceId: string): Promise<void>;

    /**
     * Called after the slice has been marked as "Failed"
    */
    onSliceFailed(sliceId: string): Promise <void>;

    /**
     * Called after the operation failed to process the slice
     * but before the slice is retried.
     * [DEPRECATION NOTICE]: this will be deprecated in near future
    */
    onSliceRetry(sliceId: string): Promise <void>;

    /**
     * Called after an operation is complete
     * @param index the index to the operation which completed
     * @param sliceId is the id of the slice being processed
     * @param processed is the number of records returned from the op
    */
    onOperationComplete?(index: number, sliceId: string, processed: number): void;
}

export interface SlicerOperationLifeCycle extends OperationLifeCycle {
    /**
     * A method called by the "Execution Controller" to give a "Slicer"
     * the opportunity to track the slices enqueued by the execution controller
    */
    onSliceEnqueued(slice: Slice): void;

    /**
     * A method called by the "Execution Controller" to give a "Slicer"
     * the opportunity to track the slices disptached by the execution controller
    */
    onSliceDispatch(slice: Slice): void;

    /**
     * A method called by the "Execution Controller" to give a "Slicer"
     * the opportunity to track the slices completed by the execution controller
    */
    onSliceComplete(result: SliceResult): void;

    /**
     * A method called by the "Execution Controller" to give a "Slicer"
     * the opportunity to track various slicer satistics
    */
    onExecutionStats(stats: ExecutionStats): void;
}

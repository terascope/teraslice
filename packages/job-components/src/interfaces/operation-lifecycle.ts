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
    onSliceFailed?(sliceId: string): Promise <void>;

    /**
     * Called after the operation failed to process the slice
     * but before the slice is retried.
     *
     * NOTE: A retry can be stopped by throw an error inside this function
    */
    onSliceRetry?(sliceId: string): Promise <void>;

    /**
     * Called immediately before an operation is started
     * @param sliceId is the id of the slice being processed
     * @param index the index to the operation which completed
     * @param processed is the number of records returned from the op
    */
    onOperationStart?(sliceId: string, index: number): void;

    /**
     * Called immediately after an operation has ended
     * @param sliceId is the id of the slice being processed
     * @param index the index to the operation which completed
     * @param processed is the number of records returned from the op
    */
    onOperationComplete?(sliceId: string, index: number, processed: number): void;
}

export interface SlicerOperationLifeCycle extends OperationLifeCycle {
    /**
     * Called during execution initialization
     * @param recoveryData is the data to recover from
    */
    initialize(recoveryData?: object[]): Promise<void>;

    /**
     * A method called by the "Execution Controller" to give a "Slicer"
     * the opportunity to track the slices enqueued by the execution controller
    */
    onSliceEnqueued?(slice: Slice): void;

    /**
     * A method called by the "Execution Controller" to give a "Slicer"
     * the opportunity to track the slices disptached by the execution controller
    */
    onSliceDispatch?(slice: Slice): void;

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

export interface WorkerOperationLifeCycle {
    /**
     * Called during execution initialization
    */
    initialize(): Promise<void>;

    /**
     * Called during execution shutdown
    */
    shutdown(): Promise<void>;

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
}

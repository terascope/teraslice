import Core from './core';
import { Context, ExecutionConfig } from '@terascope/teraslice-types';

/**
 * A base class for supporting APIs that run within an Execution Context.
 */

export default abstract class APICore extends Core {
    constructor(context: Context, executionConfig: ExecutionConfig) {
        const logger = context.apis.foundation.makeLogger({
            module: 'operation-api',
            jobName: executionConfig.name,
        });
        super(context, executionConfig, logger);
    }

    async initialize(): Promise<void> {
        this.context.logger.trace(`${this.executionConfig.name}->api is initializing...`);
    }

    async shutdown(): Promise<void> {
        this.context.logger.trace(`${this.executionConfig.name}->api is shutting down...`);
    }

    /**
     * A method called by the Teraslice framework to give an operation
     * time to run asynchronous slice initialization before the slice
     * has been handed to any operation.
    */
    async onSliceInitialized(sliceId: string): Promise<void> {
        this.context.logger.trace(`slice initialized: ${sliceId}`);
    }

    /**
     * A method called by the Teraslice framework to give an operation
     * time to run asynchronous preperation after the slice is sent
     * to the "Fetcher"
    */
    async onSliceStarted(sliceId: string): Promise<void> {
        this.context.logger.trace(`slice started: ${sliceId}`);
    }

    /**
     * A method called by the Teraslice framework to give an operation
     * time to run asynchronous cleanup after the slice is done
     * with the last operation
    */
    async onSliceFinalizing(sliceId: string): Promise<void> {
        this.context.logger.trace(`slice finalizing: ${sliceId}`);
    }

    /**
     * A method called by the Teraslice framework to give an operation
     * time to run asynchronous cleanup after the slice has
     * been acknowledged by the "Execution Controller"
    */
    async onSliceFinished(sliceId: string): Promise<void> {
        this.context.logger.trace(`slice finished: ${sliceId}`);
    }

    /**
     * A method called by the Teraslice framework to give an operation
     * time to run asynchronous cleanup after the slice has
     * been marked as "Failed"
    */
    async onSliceFailed(sliceId: string): Promise<void> {
        this.context.logger.trace(`slice failed: ${sliceId}`);
    }

    /**
     * A method called by the Teraslice framework to give an operation
     * time to run asynchronous cleanup, or setup, after the slice has
     * been failed to process and the `max_retries` is set a number
     * greater than 1.
    */
    async onSliceRetry(sliceId: string): Promise<void> {
        this.context.logger.trace(`slice retry: ${sliceId}`);
    }
}

export type APIConstructor = {
    new(context: Context, executionConfig: ExecutionConfig): APICore;
};

export type OpAPIFn = Function;
export type OpAPIInstance = {
    [method: string]: Function|any;
};
export type OpAPI = OpAPIFn | OpAPIInstance;

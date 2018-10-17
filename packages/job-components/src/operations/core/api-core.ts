import Core from './core';
import { Context, ExecutionConfig, WorkerOperationLifeCycle } from '../../interfaces';

/**
 * A base class for supporting APIs that run within an Execution Context.
 */

export default abstract class APICore extends Core implements WorkerOperationLifeCycle {
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

    async onSliceInitialized(sliceId: string): Promise<void> {
        this.context.logger.trace(`slice initialized: ${sliceId}`);
    }

    async onSliceStarted(sliceId: string): Promise<void> {
        this.context.logger.trace(`slice started: ${sliceId}`);
    }

    async onSliceFinalizing(sliceId: string): Promise<void> {
        this.context.logger.trace(`slice finalizing: ${sliceId}`);
    }

    async onSliceFinished(sliceId: string): Promise<void> {
        this.context.logger.trace(`slice finished: ${sliceId}`);
    }

    async onSliceFailed(sliceId: string): Promise<void> {
        this.context.logger.trace(`slice failed: ${sliceId}`);
    }

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

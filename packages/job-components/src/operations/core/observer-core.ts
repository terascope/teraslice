import Core from './core';
import SliceEvents from './slice-events';
import { Context, ExecutionConfig } from '@terascope/teraslice-types';

/**
 * A base class for observing the events happening within an Execution
 */
export default abstract class ObserverCore extends Core implements SliceEvents {
    constructor(context: Context, executionConfig: ExecutionConfig) {
        const logger = context.apis.foundation.makeLogger({
            module: 'observer',
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

export type ObserverCoreConstructor = {
    new(context: Context, executionConfig: ExecutionConfig): ObserverCore;
};

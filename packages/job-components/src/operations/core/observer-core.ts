import Core from './core';
import { WorkerContext } from '../../execution-context';
import { ExecutionConfig, WorkerOperationLifeCycle } from '../../interfaces';

/**
 * A base class for observing the events happening within an Execution
 */
export default abstract class ObserverCore extends Core implements WorkerOperationLifeCycle {
    constructor(context: WorkerContext, executionConfig: ExecutionConfig) {
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

    // @ts-ignore
    async onSliceInitialized(sliceId: string): Promise<void> {

    }

    // @ts-ignore
    async onSliceStarted(sliceId: string): Promise<void> {

    }

    // @ts-ignore
    async onSliceFinalizing(sliceId: string): Promise<void> {

    }

    // @ts-ignore
    async onSliceFinished(sliceId: string): Promise<void> {

    }

    // @ts-ignore
    async onSliceFailed(sliceId: string): Promise<void> {

    }

    // @ts-ignore
    async onSliceRetry(sliceId: string): Promise<void> {

    }
}

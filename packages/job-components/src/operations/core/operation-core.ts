import _ from 'lodash';
import '../../formats'; // require to add the schema formats
import Core from './core';
import convict from 'convict';
import { OpAPI } from './api-core';
import { Context, ExecutionConfig, OpConfig } from '@terascope/teraslice-types';
import { validateOpConfig } from '../../config-validators';

/**
 * A base class for supporting operations that run on a "Worker",
 * that supports the job execution lifecycle events.
 * This class will likely not be used externally
 * since Teraslice only supports a few types varients based on this class.
 * @see Core
 */

export default class OperationCore extends Core {
    /**
     * This is called by the Teraslice framework in-order to delegrate the
     * the schema validation to place that can be customized depending on
     * the operations need.
     * In the case of "Reader" the "Slicer" and "Fetcher" schema are shared
     * but the "Fetcher" is the operation that will handle the validation
    */
    static async validate(inputSchema: convict.Schema<any>, inputConfig: any): Promise<OpConfig> {
        return validateOpConfig(inputSchema, inputConfig);
    }

    protected readonly opConfig: Readonly<OpConfig>;

    constructor(context: Context, opConfig: OpConfig, executionConfig: ExecutionConfig) {
        const logger = context.apis.foundation.makeLogger({
            module: 'operation',
            opName: opConfig._op,
            jobName: executionConfig.name,
        });
        super(context, executionConfig, logger);
        this.opConfig = opConfig;
    }

    async initialize(): Promise<void> {
        this.context.logger.trace(`${this.executionConfig.name}->${this.opConfig._op} is initializing...`);
    }

    async shutdown(): Promise<void> {
        this.context.logger.trace(`${this.executionConfig.name}->${this.opConfig._op} is shutting down...`);
    }

    /**
     * Create an API and add it to the operation lifecycle
    */
    async createAPI(name: string, ...params: any[]): Promise<OpAPI> {
        return this.context.apis.executionContext.initAPI(name, ...params);
    }

    /**
     * Get a reference to an existing API
    */
    async getAPI(name: string): Promise<OpAPI> {
        return this.context.apis.executionContext.getAPI(name);
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

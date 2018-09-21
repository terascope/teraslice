import _ from 'lodash';
import convict from 'convict';
import * as D from '../data-entity';
import { EventEmitter } from 'events';
import { validateOpConfig } from '../../config-validators';
import { Context, ExecutionConfig, Logger, OpConfig } from '@terascope/teraslice-types';

/**
 * OperationCore [DRAFT]
 * @description A base class for supporting operations that run on a "Worker",
 *              that supports the job execution lifecycle events.
 *              This class will likely not be used externally
 *              since Teraslice only supports a few types varients based on this class.
 */

export class OperationCore {
    /**
     * @description This is called by the Teraslice framework in-order to delegrate the
     *              the schema validation to place that can be customized depending on
     *              the operations need.
     *              In the case of "Reader" the "Slicer" and "Fetcher" schema are shared
     *              but the "Fetcher" is the operation that will handle the validation
    */
    static async validate(inputSchema: convict.Schema<any>, inputConfig: any): Promise<OpConfig> {
        return validateOpConfig(inputSchema, inputConfig);
    }

    protected readonly context: Readonly<Context>;
    protected readonly executionConfig: Readonly<ExecutionConfig>;
    protected readonly opConfig: Readonly<OpConfig>;
    protected readonly logger: Logger;
    protected readonly events: EventEmitter;

    constructor(context: Context, opConfig: OpConfig, executionConfig: ExecutionConfig) {
        this.context = context;
        this.executionConfig = executionConfig;
        this.opConfig = opConfig;
        this.logger = this.context.apis.foundation.makeLogger({
            module: 'operation',
            opName: opConfig._op,
            jobName: executionConfig.name,
        });
        this.events = context.apis.foundation.getSystemEvents();
    }

    /**
     * @description this is called by the "Worker" in order to give any operation
     *              time to run asynchronous setup
    */
    async initialize(): Promise<void> {
        this.context.logger.debug(`${this.executionConfig.name}->${this.opConfig._op} is initialzing...`);
        return;
    }

    /**
     * @description this is called by the "Worker" in order to give any operation
     *              time to run asynchronous cleanup.
    */
    async shutdown(): Promise<void> {
        this.context.logger.debug(`${this.executionConfig.name}->${this.opConfig._op} is shutting down...`);
        return;
    }

    /**
     * @description this is called by the "Worker" in order to give any operation
     *              time to run asynchronous slice initialization before the slice
     *              has been handed to any operation.
    */
    async onSliceInitialized(sliceId: string): Promise<void> {
        this.context.logger.debug(`slice initialized: ${sliceId}`);
    }

    /**
     * @description this is called by the "Worker" in order to give any operation
     *              time to run asynchronous preperation after the slice is sent
     *              to the "Fetcher"
    */
    async onSliceStarted(sliceId: string): Promise<void> {
        this.context.logger.debug(`slice started: ${sliceId}`);
    }

    /**
     * @description this is called by the "Worker" in order to give any operation
     *              time to run asynchronous cleanup after the slice is done
     *              with the last operation
    */
    async onSliceFinalizing(sliceId: string): Promise<void> {
        this.context.logger.debug(`slice finalizing: ${sliceId}`);
    }

    /**
     * @description this is called by the "Worker" in order to give any operation
     *              time to run asynchronous cleanup after the slice has
     *              been acknowledged by the "Execution Controller"
    */
    async onSliceFinished(sliceId: string): Promise<void> {
        this.context.logger.debug(`slice finished: ${sliceId}`);
    }

    /**
     * @description this is called by the "Worker" in order to give any operation
     *              time to run asynchronous cleanup after the slice has
     *              been marked as "Failed"
    */
    async onSliceFailed(sliceId: string): Promise<void> {
        this.context.logger.debug(`slice failed: ${sliceId}`);
    }

    /**
     * @description this is called by the "Worker" in order to give any operation
     *              time to run asynchronous cleanup, or setup, after the slice has
     *              been failed to process and the `max_retries` is set a number
     *              greater than 1.
    */
    async onSliceRetry(sliceId: string): Promise<void> {
        this.context.logger.debug(`slice retry: ${sliceId}`);
    }

    /**
     * @description a utility for safely converting an object a DataEntity.
     *              This will detect if passed an already converted input and return it.
    */
    toDataEntity(input: D.DataInput): D.DataEntity {
        return D.toDataEntity(input);
    }

    /**
     * @description a utility for safely converting an input of an object,
     *              or an array of objects, to an array of DataEntities.
     *              This will detect if passed an already converted input and return it.
    */
    toDataEntities(input: D.DataArrayInput): D.DataEntity[] {
        return D.toDataEntities(input);
    }

    /**
     * @description a utility for safely converting an input of an object,
     *              an array of objects, a "List" of objects, to an immutable "List" of DataEntities.
     *              This will detect if passed an already converted input and return it.
    */
    toDataEntityList(input: D.DataListInput): D.DataEntityList {
        return D.toDataEntityList(input);
    }
}

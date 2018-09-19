import { Context, ExecutionConfig, Logger, OpConfig } from '@terascope/teraslice-types';
import convict from 'convict';
import _ from 'lodash';
import { DataEntity } from './data-entity';
import { validateOpConfig } from '../config-validators';

/**
 * OperationCore Base Class [DRAFT]
 * @description The core base class for operation subclasses,
 *              that supports the job execution lifecycle events.
 *              This class will likely not be used externally
 *              since Teraslice only supports a few subclass varients.
 */

export class OperationCore {
    static async validate(inputSchema: convict.Schema<any>, inputConfig: any): Promise<OpConfig> {
        return validateOpConfig(inputSchema, inputConfig);
    }

    protected readonly context: Context;
    protected readonly executionConfig: ExecutionConfig;
    protected readonly opConfig: OpConfig;
    protected readonly logger: Logger;

    constructor(context: Context, executionConfig: ExecutionConfig, opConfig: OpConfig, logger: Logger) {
        this.context = context;
        this.executionConfig = executionConfig;
        this.opConfig = opConfig;
        this.logger = logger;
    }

    async initialize(): Promise<void> {
        this.context.logger.debug(`${this.executionConfig.name}->${this.opConfig._op} is initialzing...`);
        return;
    }

    async shutdown(): Promise<void> {
        this.context.logger.debug(`${this.executionConfig.name}->${this.opConfig._op} is shutting down...`);
        return;
    }

    async onSliceInitialized(sliceId: string): Promise<void> {
        this.context.logger.debug(`slice initialized: ${sliceId}`);
    }

    async onSliceStarted(sliceId: string): Promise<void> {
        this.context.logger.debug(`slice started: ${sliceId}`);
    }

    async onSliceFinalizing(sliceId: string): Promise<void> {
        this.context.logger.debug(`slice finalizing: ${sliceId}`);
    }

    async onSliceFinished(sliceId: string): Promise<void> {
        this.context.logger.debug(`slice finished: ${sliceId}`);
    }

    async onSliceFailed(sliceId: string): Promise<void> {
        this.context.logger.debug(`slice failed: ${sliceId}`);
    }

    async onSliceRetry(sliceId: string): Promise<void> {
        this.context.logger.debug(`slice retry: ${sliceId}`);
    }

    convertDataToDataEntity(data: object): DataEntity {
        return new DataEntity(data);
    }

    convertBatchToDataEntity(batch: object[]): DataEntity[] {
        return _.map(batch, this.convertDataToDataEntity);
    }
}

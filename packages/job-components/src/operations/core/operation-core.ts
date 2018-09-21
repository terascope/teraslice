import _ from 'lodash';
import convict from 'convict';
import * as D from '../data-entity';
import { EventEmitter } from 'events';
import { validateOpConfig } from '../../config-validators';
import { Context, ExecutionConfig, Logger, OpConfig } from '@terascope/teraslice-types';

/**
 * Operation Base Class [DRAFT]
 * @description A base class for supporting operations that run on a "Worker",
 *              that supports the job execution lifecycle events.
 *              This class will likely not be used externally
 *              since Teraslice only supports a few types varients.
 */

export class OperationCore {
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

    toDataEntity(input: D.DataInput): D.DataEntity {
        return D.toDataEntity(input);
    }

    toDataEntities(input: D.DataArrayInput): D.DataEntity[] {
        return D.toDataEntities(input);
    }

    toDataEntityList(input: D.DataListInput): D.DataEntityList {
        return D.toDataEntityList(input);
    }
}

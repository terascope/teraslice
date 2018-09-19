import _ from 'lodash';
import { EventEmitter } from 'events';
import {
    Context,
    ExecutionConfig,
    Logger,
    OpConfig,
    Slice,
    SliceAnalyticsData
} from '@terascope/teraslice-types';

/**
 * SlicerCore [DRAFT]
 * @description A base class for supporting "Slicers" that run on a "Execution Controller",
 *              that supports the execution lifecycle events.
 *              This class will likely not be used externally
 *              since Teraslice only supports a few type varients.
 */

export class SlicerCore {
    protected readonly context: Readonly<Context>;
    protected readonly executionConfig: Readonly<ExecutionConfig>;
    protected readonly opConfig: Readonly<OpConfig>;
    protected readonly logger: Logger;
    protected readonly events: EventEmitter;
    protected _slicers: Function[];

    constructor(context: Context, executionConfig: ExecutionConfig, opConfig: OpConfig, logger: Logger) {
        this.context = context;
        this.executionConfig = executionConfig;
        this.opConfig = opConfig;
        this.logger = logger;
        this.events = context.apis.foundation.getSystemEvents();
        this._slicers = [];
    }

    async initialize(recoveryData: object[]): Promise<void> {
        this.context.logger.debug(`${this.executionConfig.name}->${this.opConfig._op} is initializing...`, recoveryData);
    }

    async shutdown(): Promise<void> {
        this.context.logger.debug(`${this.executionConfig.name}->${this.opConfig._op} is shutting down...`);
    }

    async onSliceEnqueued(slice: Slice): Promise<void> {
        this.context.logger.debug('slice enqueued', slice);
    }

    async onSliceDispatch(slice: Slice): Promise<void> {
        this.context.logger.debug('slice dispatch', slice);
    }

    async onSliceComplete(result: SliceResult): Promise<void> {
        this.context.logger.debug('slice result', result);
    }

}

export type SlicerResult = object | object[] | null;

export interface SliceResult {
    slice: Slice;
    analytics: SliceAnalyticsData;
    retry?: boolean;
    error?: string;
}

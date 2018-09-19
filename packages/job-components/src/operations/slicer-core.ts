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
 * SlicerCore Base Class [DRAFT]
 * @description The core base class for slicer subclasses,
 *              that supports the execution lifecycle events.
 *              This class will likely not be used externally
 *              since Teraslice only supports a few subclass varients.
 */

export class SlicerCore {
    protected readonly context: Context;
    protected readonly executionConfig: ExecutionConfig;
    protected readonly opConfig: OpConfig;
    protected readonly logger: Logger;
    protected readonly events: EventEmitter;

    constructor(context: Context, executionConfig: ExecutionConfig, opConfig: OpConfig, logger: Logger) {
        this.context = context;
        this.executionConfig = executionConfig;
        this.opConfig = opConfig;
        this.logger = logger;
        this.events = context.apis.foundation.getSystemEvents();
    }

    async initialize(startingPoints: object[]): Promise<void> {
        this.context.logger.debug(`${this.executionConfig.name}->${this.opConfig._op} is initialzing...`, startingPoints);
        return;
    }

    async shutdown(): Promise<void> {
        this.context.logger.debug(`${this.executionConfig.name}->${this.opConfig._op} is shutting down...`);
        return;
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

export interface SliceResult {
    slice: Slice;
    analytics: SliceAnalyticsData;
    retry?: boolean;
    error?: string;
}

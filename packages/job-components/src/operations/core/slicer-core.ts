import _ from 'lodash';
import { EventEmitter } from 'events';
import uuidv4 from 'uuid/v4';
import {
    Context,
    ExecutionConfig,
    Logger,
    OpConfig,
    Slice,
    SliceAnalyticsData,
    SliceRequest
} from '@terascope/teraslice-types';
import Queue from '@terascope/queue';

/**
 * SlicerCore [DRAFT]
 * @description A base class for supporting "Slicers" that run on a "Execution Controller",
 *              that supports the execution lifecycle events.
 *              This class will likely not be used externally
 *              since Teraslice only supports a few type varients.
 */

export abstract class SlicerCore {
    protected readonly context: Readonly<Context>;
    protected readonly executionConfig: Readonly<ExecutionConfig>;
    protected readonly opConfig: Readonly<OpConfig>;
    protected readonly logger: Logger;
    protected readonly events: EventEmitter;
    private queue: Queue;

    constructor(context: Context, opConfig: OpConfig, executionConfig: ExecutionConfig) {
        this.context = context;
        this.executionConfig = executionConfig;
        this.opConfig = opConfig;
        this.logger = this.context.apis.foundation.makeLogger({
            module: 'slicer',
            opName: opConfig._op,
            jobName: executionConfig.name,
        });
        this.events = context.apis.foundation.getSystemEvents();
        this.queue = new Queue();
    }

    // this method is called by the teraslice framework
    abstract async handle(): Promise<boolean>;

    enqueue(input: Slice|SliceRequest, order: number, id: number = 0) {
        let slice: Slice;
        let needsState = false;

        // recovery slices already have correct meta data
        if (input.slice_id) {
            slice = input as Slice;
        } else {
            needsState = true;
            slice = {
                slice_id: uuidv4(),
                request: input,
                slicer_id: id,
                slicer_order: order,
                _created: new Date().toISOString()
            };
        }

        this.queue.enqueue({
            needsState,
            slice
        });
    }

    dequeue() {
        return this.queue.dequeue();
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

export type SlicerResult = Slice|SliceRequest | Slice|SliceRequest[] | null;

export interface SliceResult {
    slice: Slice;
    analytics: SliceAnalyticsData;
    retry?: boolean;
    error?: string;
}

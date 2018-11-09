import uuidv4 from 'uuid/v4';
import { SlicerContext } from '../../execution-context';
import {
    ExecutionConfig,
    OpConfig,
    Slice,
    SliceRequest,
    SlicerOperationLifeCycle,
    ExecutionStats,
    LifeCycle,
} from '../../interfaces';
import Queue from '@terascope/queue';
import Core from './core';

/**
 * A base class for supporting "Slicers" that run on a "Execution Controller",
 * that supports the execution lifecycle events.
 * This class will likely not be used externally
 * since Teraslice only supports a few type varients.
 * @see Core
 */

export default abstract class SlicerCore<T> extends Core implements SlicerOperationLifeCycle {
    protected stats: ExecutionStats;
    protected recoveryData: object[];
    protected readonly opConfig: Readonly<OpConfig & T>;
    private readonly queue: Queue<Slice>;

    constructor(context: SlicerContext, opConfig: OpConfig & T, executionConfig: ExecutionConfig) {
        const logger = context.apis.foundation.makeLogger({
            module: 'slicer',
            opName: opConfig._op,
            jobName: executionConfig.name,
            jobId: executionConfig.job_id,
            exId: executionConfig.ex_id,
        });

        super(context, executionConfig, logger);

        this.opConfig = opConfig;
        this.queue = new Queue();
        this.recoveryData = [];
        this.stats = {
            workers: {
                connected: 0,
                available: 0,
            },
            slices: {
                processed: 0,
                failed: 0,
            }
        };
    }

    async initialize(recoveryData: object[]): Promise<void> {
        this.recoveryData = recoveryData;
        this.context.logger.trace(`${this.executionConfig.name}->${this.opConfig._op} is initializing...`, recoveryData);
    }

    async shutdown(): Promise<void> {
        this.context.logger.trace(`${this.executionConfig.name}->${this.opConfig._op} is shutting down...`);
    }

    /**
    * A generic method called by the Teraslice framework to a give a "Slicer"
    * the ability to handle creating slices.
    * @returns a boolean depending on whether the slicer is done
    */
    abstract async handle(): Promise<boolean>;

    /**
     * Return the number of registered slicers
    */
    abstract slicers(): number;

    /**
     * Create a Slice object from a slice request.
     * In the case of recovery the "Slice" already has the required
     * This will be enqueued and dequeued by the "Execution Controller"
    */
    createSlice(input: Slice|SliceRequest, order: number, id: number = 0) {
        // recovery slices already have correct meta data
        if (input.slice_id) {
            this.queue.enqueue(input as Slice);
        } else {
            this.queue.enqueue({
                slice_id: uuidv4(),
                slicer_id: id,
                slicer_order: order,
                request: input,
            } as Slice);
        }
    }

    /**
     * A method called by the "Execution Controller" to dequeue a created "Slice"
    */
    getSlice(): Slice|null {
        if (!this.sliceCount()) return null;
        return this.queue.dequeue();
    }

    /**
     * A method called by the "Execution Controller" to dequeue many created slices
    */
    getSlices(max: number): Slice[] {
        const count = max > this.sliceCount() ? this.sliceCount() : max;

        const slices: Slice[] = [];

        for (let i = 0; i < count; i++) {
            const slice = this.queue.dequeue();
            if (!slice) return slices;

            slices.push(slice);
        }

        return slices;
    }

    /**
     * The number of enqueued slices
    */
    sliceCount(): number {
        return this.queue.size();
    }

    /**
     * Used to indicate whether this slicer is recoverable.
    */
    isRecoverable() {
        return false;
    }

    /**
     * Used to determine the maximum number of slices queued.
     * Defaults to 10000
     * NOTE: if you want to base of the number of
     * workers use {@link #workersConnected}
    */
    maxQueueLength() {
        return 10000;
    }

    onExecutionStats(stats: ExecutionStats) {
        this.stats = stats;
    }

    protected canComplete(): boolean {
        return this.executionConfig.lifecycle === LifeCycle.Once;
    }

    protected get workersConnected() {
        return this.stats.workers.connected;
    }
}

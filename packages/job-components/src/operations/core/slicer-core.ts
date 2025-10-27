import { v4 as uuidv4 } from 'uuid';
import { Queue } from '@terascope/core-utils';
import {
    OpConfig, ExecutionConfig, Slice,
    SliceRequest, SlicerOperationLifeCycle,
    ExecutionStats, Context, SlicerRecoveryData,
    OpAPI
} from '../../interfaces/index.js';
import Core from './core.js';
import { makeExContextLogger } from '../../utils.js';

/**
 * A base class for supporting "Slicers" that run on a "Execution Controller",
 * that supports the execution lifecycle events.
 * This class will likely not be used externally
 * since Teraslice only supports a few type varients.
 *
 * See [[Core]] for more information
 */

export default abstract class SlicerCore<T = OpConfig>
    extends Core<Context>
    implements SlicerOperationLifeCycle {
    // ...
    protected stats: ExecutionStats;
    protected recoveryData: SlicerRecoveryData[];
    protected readonly opConfig: Readonly<OpConfig & T>;
    private readonly queue: Queue<Slice>;

    constructor(context: Context, opConfig: OpConfig & T, executionConfig: ExecutionConfig) {
        const logger = makeExContextLogger(context, executionConfig, 'slicer', {
            opName: opConfig._op,
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
            },
        };
    }

    /**
     * Called during execution initialization
     * @param recoveryData is the data to recover from
     */
    async initialize(recoveryData: SlicerRecoveryData[]): Promise<void> {
        this.recoveryData = recoveryData;
        this.context.logger.trace(`${this.executionConfig.name}->${this.opConfig._op} is initializing...`, recoveryData);
    }

    async shutdown(): Promise<void> {
        this.context.logger.trace(`${this.executionConfig.name}->${this.opConfig._op} is shutting down...`);
    }

    /**
     * Create an API and add it to the operation lifecycle
     */
    async createAPI<A extends OpAPI = OpAPI>(name: string, ...params: any[]): Promise<A> {
        return this.context.apis.executionContext.initAPI<A>(name, ...params);
    }

    /**
     * Get a reference to an existing API
     */
    getAPI<A extends OpAPI = OpAPI>(name: string): A {
        return this.context.apis.executionContext.getAPI<A>(name);
    }

    /**
     * A generic method called by the Teraslice framework to a give a "Slicer"
     * the ability to handle creating slices.
     * @returns a boolean depending on whether the slicer is done
     */
    abstract handle(): Promise<boolean>;

    /**
     * Return the number of registered slicers
     */
    abstract slicers(): number;

    /**
     * Create a Slice object from a slice request.
     * In the case of recovery the "Slice" already has the required
     * This will be enqueued and dequeued by the "Execution Controller"
     */
    createSlice(input: Slice | SliceRequest, order: number, id = 0): void {
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
    getSlice(): Slice | null {
        if (!this.sliceCount()) return null;
        const result = this.queue.dequeue();
        return result != null ? result : null;
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
    isRecoverable(): boolean {
        return false;
    }

    /**
     * Used to indicate whether this slicer is relocatable. Only relevant for
     * kubernetesV2 backend
     */
    isRelocatable(): boolean {
        return false;
    }

    /**
     * Used to determine the maximum number of slices queued.
     * Defaults to 10000
     * NOTE: if you want to base of the number of
     * workers use {@link #workersConnected}
     */
    maxQueueLength(): number {
        return 10000;
    }

    onExecutionStats(stats: ExecutionStats): void {
        this.stats = stats;
    }

    protected canComplete(): boolean {
        return this.executionConfig.lifecycle === 'once';
    }

    protected get workersConnected(): number {
        return this.stats.workers.connected;
    }
}

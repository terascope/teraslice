import {
    SlicerExecutionContext,
    JobConfigParams,
    Slice,
    SliceRequest,
    SliceResult,
    ExecutionStats,
    SlicerCore,
    SlicerRecoveryData,
    times,
    isPlainObject,
    APICore,
    OpAPI
} from '@terascope/job-components';
import BaseTestHarness from './base-test-harness.js';
import { JobHarnessOptions } from './interfaces.js';

/**
 * A test harness for testing Operations that run on
 * the Execution Controller, mainly the Slicer.
 * This is useful for testing Slicers.
*/

type SliceResults = (SliceRequest | Slice | null)[];

export default class SlicerTestHarness extends BaseTestHarness<SlicerExecutionContext> {
    readonly stats: ExecutionStats = {
        workers: {
            available: 1,
            connected: 1,
        },
        slices: {
            processed: 0,
            failed: 0,
        }
    };

    private _emitInterval: any;

    constructor(job: JobConfigParams, options: JobHarnessOptions) {
        super(job, options, 'execution_controller');
    }

    slicer<T extends SlicerCore = SlicerCore>(): T {
        return this.executionContext.slicer<T>();
    }

    /**
     * Initialize the Operations on the ExecutionContext
     * @param recoveryData is an array of starting points to recover from
    */
    async initialize(recoveryData: SlicerRecoveryData[] = []): Promise<void> {
        await super.initialize();

        const { config } = this.executionContext;
        if (config.recovered_execution && !this.slicer().isRecoverable()) {
            throw new Error('Slicer is not recoverable');
        }
        // teraslice checks to see if slicer is recoverable
        // should throw test recoveryData if slicer is not recoverable
        if (recoveryData.length > 0) {
            if (!this.executionContext.slicer().isRecoverable()) {
                throw new Error('Slicer is not recoverable, please create the isRecoverable method and return true to enable recovery');
            }
            if (!recoveryData.every(isPlainObject)) {
                throw new Error('recoveryData is malformed');
            }
        }

        await this.executionContext.initialize(recoveryData);
        this.executionContext.onExecutionStats(this.stats);
        this._emitInterval = setInterval(() => {
            this.executionContext.onExecutionStats(this.stats);
        }, 100);
    }

    /**
     * Create Slices, always returns an Array of slices or slice requests.
     * To adjust the number of slicers change the job configuration
     * when constructing this class.
     *
     * If the slicers are done, you should expect a null value for every slicer
     *
     * @param options an optional object of additional configuration
     * @param options.fullResponse if specified the full slice result
     * including the slice_id, slicer_id, slicer_order.
     *
     * @returns an array of Slices including the metadata or the just the Slice Request.
    */
    async createSlices(): Promise<(SliceRequest | null)[]>;
    async createSlices(options: { fullResponse: false }): Promise<(SliceRequest | null)[]>;
    async createSlices(options: { fullResponse: true }): Promise<(Slice | null)[]>;
    async createSlices({ fullResponse = false } = {}): Promise<(SliceRequest | Slice | null)[]> {
        const slicers = this.slicer().slicers();

        await this.slicer().handle();

        const slices = this.slicer().getSlices(10000);
        const sliceRequests: (Slice | SliceRequest | null)[] = [];
        const slicesBySlicers: (Slice[])[] = [];

        for (const slice of slices) {
            if (slicesBySlicers[slice.slicer_id] == null) {
                slicesBySlicers[slice.slicer_id] = [];
            }
            slicesBySlicers[slice.slicer_id].push(slice);
        }

        for (const perSlicer of slicesBySlicers) {
            if (perSlicer == null) continue;

            const sorted = perSlicer.sort((a, b) => a.slicer_order - b.slicer_order);
            sorted.forEach((slice) => {
                this.executionContext.onSliceEnqueued(slice);
            });

            if (fullResponse) {
                sliceRequests.push(...sorted);
            } else {
                const mapped = sorted.map(({ request }) => request);
                sliceRequests.push(...mapped);
            }
        }

        const remaining = slicers - sliceRequests.length;
        if (remaining > 0) {
            const nulls = times(remaining, () => null);
            return sliceRequests.concat(nulls);
        }

        return sliceRequests;
    }

    async getAllSlices(): Promise<SliceResults>;
    async getAllSlices(options: { fullResponse: false }): Promise<(Slice | null)[]>;
    async getAllSlices(options: { fullResponse: true }): Promise<(SliceRequest | null)[]>;
    async getAllSlices({ fullResponse = false } = {}): Promise<SliceResults> {
        if (this.executionContext.config.lifecycle !== 'once') {
            throw new Error('This method can only be used when lifecycle is set to "once"');
        }
        const results: (SliceRequest | Slice | null)[] = [];

        const run = async (): Promise<void> => {
            let sliceResults: SliceResults;
            if (fullResponse) {
                sliceResults = await this.createSlices({ fullResponse });
            } else {
                sliceResults = await this.createSlices();
            }
            results.push(...sliceResults);

            // @ts-expect-error
            if (!this.slicer().isFinished) {
                return run();
            }
        };

        await run();

        return results;
    }

    setWorkers(count: number): void {
        this.stats.workers.connected = count;
        this.stats.workers.available = count;
        this.executionContext.onExecutionStats(this.stats);
    }

    onSliceDispatch(slice: Slice): void {
        this.executionContext.onSliceDispatch(slice);
    }

    onSliceComplete(result: SliceResult): void {
        this.executionContext.onSliceComplete(result);
    }

    get apis(): SlicerExecutionContext['apis'] {
        return this.executionContext.apis;
    }

    /**
     * Get the reference to a created API that a operation will use.
     * This is different than getOperationAPI which the OperationAPI class instance
    */
    getAPI<T extends OpAPI = any>(name: string): T {
        return this.executionContext.api.getAPI<T>(name);
    }

    /**
     * Get the instantiated OperationAPI class instance from the apis. If you are looking
     * for the APIs that created during run time, use getAPI.
    */
    getOperationAPI<T extends APICore = APICore>(name: string): T {
        if (!this.apis[name]?.instance) {
            throw new Error(`Operation API "${name}" not found`);
        }
        return this.apis[name].instance as T;
    }

    /**
     * Shutdown the Operations on the ExecutionContext
    */
    async shutdown(): Promise<void> {
        if (this._emitInterval) {
            clearInterval(this._emitInterval);
        }
        await super.shutdown();
    }
}

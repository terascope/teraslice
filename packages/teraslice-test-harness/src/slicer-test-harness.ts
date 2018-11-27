import { sortBy, map, groupBy, times } from 'lodash';
import {
    SlicerExecutionContext,
    JobConfig,
    Slice,
    SliceRequest,
    SliceResult,
    ExecutionStats,
} from '@terascope/job-components';
import BaseTestHarness from './base-test-harness';
import { JobHarnessOptions } from './interfaces';

/**
 * A test harness for testing Operations that run on
 * the Execution Controller, mainly the Slicer.
 * This is useful for testing Slicers.
*/
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

    private _emitInterval: NodeJS.Timer|undefined;

    constructor(job: JobConfig, options: JobHarnessOptions) {
        super(job, options, 'execution_controller');
    }

    get slicer() {
        return this.executionContext.slicer;
    }

    /**
     * Initialize the Operations on the ExecutionContext
     * @param recoveryData is an array of starting points to recover from
    */
    async initialize(recoveryData?: object[]) {
        await super.initialize();
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
     * @param options an optional object of additional configruation
     * @param options.fullResponse if specified the full slice result
     * including the slice_id, slicer_id, slicer_order.
     *
     * @returns an array of Slices including the metadata or the just the Slice Request.
    */
    async createSlices({ fullResponse = false } = {}): Promise<SliceRequest[]|Slice[]> {
        const { slicer } = this.executionContext;
        const slicers = slicer.slicers();
        await slicer.handle();

        const slices = slicer.getSlices(10000);
        const sliceRequests = [];
        const slicesBySlicers = Object.values(groupBy(slices, 'slicer_id'));

        for (const perSlicer of slicesBySlicers) {
            const sorted = sortBy(perSlicer, 'slicer_order');
            sorted.forEach((slice) => {
                this.executionContext.onSliceEnqueued(slice);
            });

            if (fullResponse) {
                sliceRequests.push(...sorted);
            } else {
                const mapped = map(sorted, 'request');
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

    setWorkers(count: number) {
        this.stats.workers.connected = count;
        this.stats.workers.available = count;
        this.executionContext.onExecutionStats(this.stats);
    }

    onSliceDispatch(slice: Slice) {
        this.executionContext.onSliceDispatch(slice);
    }

    onSliceComplete(result: SliceResult) {
        this.executionContext.onSliceComplete(result);
    }

    /**
     * Shutdown the Operations on the ExecutionContext
    */
    async shutdown() {
        if (this._emitInterval) {
            clearInterval(this._emitInterval);
        }
        await super.shutdown();
        await this.executionContext.shutdown();
    }
}

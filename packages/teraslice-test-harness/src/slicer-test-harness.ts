import { sortBy, map, groupBy, times } from 'lodash';
import {
    SlicerExecutionContext,
    SlicerContext,
    JobConfig,
    Slice,
    SliceRequest,
} from '@terascope/job-components';
import BaseTestHarness from './base-test-harness';
import { JobHarnessOptions, TestMode } from './interfaces';

/**
 * A Teraslice Test Harness for testing the Operations
 * ran on the Execution Controller, maining the Slicer,
 * and an associated lifecycle events.
 *
 * @todo Add support for lifecycle events
 * @todo Add support for attaching APIs and Observers
*/
export default class SlicerTestHarness extends BaseTestHarness {
    protected executionContext: SlicerExecutionContext;
    protected context: SlicerContext;

    constructor(job: JobConfig, options: JobHarnessOptions) {
        super(TestMode.Slicer);

        const config = this.makeContextConfig(job, options.assetDir);
        this.executionContext = new SlicerExecutionContext(config);
        this.context = this.executionContext.context;

        this.setClients(options.clients);
    }

    /**
     * Initialize the Operations on the ExecutionContext
     * @param recoveryData is an array of starting points to recover from
    */
    async initialize(recoveryData?: object[]) {
        await super.initialize();
        await this.executionContext.initialize(recoveryData);
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

    /**
     * Shutdown the Operations on the ExecutionContext
    */
    async shutdown() {
        await super.shutdown();
        await this.executionContext.shutdown();
    }
}

import { sortBy, map, groupBy, times } from 'lodash';
import {
    SlicerExecutionContext,
    SlicerContext,
    JobConfig,
    Assignment,
    Slice,
    SliceRequest,
} from '@terascope/job-components';
import BaseTestHarness from './base-test-harness';
import { JobHarnessOptions } from './interfaces';

export default class SlicerTestHarness extends BaseTestHarness {
    protected executionContext: SlicerExecutionContext;
    protected context: SlicerContext;

    constructor(job: JobConfig, options: JobHarnessOptions) {
        super();

        const config = this.makeContextConfig(job, Assignment.ExecutionController);
        this.executionContext = new SlicerExecutionContext(config);
        this.context = this.executionContext.context;

        this.setClients(options.clients);
    }

    async initialize(retryData?: []) {
        await super.initialize();
        await this.executionContext.initialize(retryData);
    }

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

    async shutdown() {
        await super.shutdown();
        await this.executionContext.shutdown();
    }
}

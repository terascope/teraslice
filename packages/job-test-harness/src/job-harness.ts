import { sortBy, map, groupBy, times } from 'lodash';
import {
    TestContext,
    JobConfig,
    Assignment,
    makeJobSchema,
    makeExecutionContext,
    validateJobConfig,
    WorkerExecutionContext,
    SlicerExecutionContext,
    ExecutionConfig,
    Slice,
    isWorkerExecutionContext,
    isSlicerExecutionContext,
} from '@terascope/job-components';

export default class JobHarness {
    protected context: WorkerExecutionContext|SlicerExecutionContext;

    constructor(job: JobConfig, options: JobHarnessOptions) {
        const context = new TestContext(`job-harness:${job.name}`);
        context.assignment = options.assignment || Assignment.Worker;

        const jobSchema = makeJobSchema(context);
        const executionConfig = validateJobConfig(jobSchema, job) as ExecutionConfig;
        this.context = makeExecutionContext({
            context,
            executionConfig
        });
    }

    async initialize() {
        await this.context.initialize();
    }

    async createSlices({ fullSlice = false } = {}) {
        if (!isSlicerExecutionContext(this.context)) {
            throwInvalidContext('createSlices', this.context);
            return;
        }
        const { slicer } = this.context;
        const slicers = slicer.slicers();
        await slicer.handle();

        const slices = slicer.getSlices(10000);
        const sliceRequests = [];
        const slicesBySlicers = Object.values(groupBy(slices, 'slicer_id'));

        for (const perSlicer of slicesBySlicers) {
            const sorted = sortBy(perSlicer, 'slicer_order');
            if (fullSlice) {
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

    async runSlice(slice: Slice) {
        if (!isWorkerExecutionContext(this.context)) {
            throwInvalidContext('runSlice', this.context);
            return;
        }
        return this.context.runSlice(slice);
    }

    async cleanup() {
        return this.context.shutdown();
    }
}

function throwInvalidContext(method: string, context: WorkerExecutionContext|SlicerExecutionContext) {
    const { assignment } = context.context;
    const expected = assignment === Assignment.Worker ? Assignment.ExecutionController : Assignment.Worker;
    const error = new Error(`${method} can only be run with assignment of "${expected}"`);
    Error.captureStackTrace(error, throwInvalidContext);
    throw error;
}

export interface JobHarnessOptions {
    assignment?: Assignment;
    assetDir: string;
}

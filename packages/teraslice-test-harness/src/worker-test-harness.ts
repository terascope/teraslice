import {
    WorkerExecutionContext,
    WorkerContext,
    JobConfig,
    Slice,
    DataEntity,
    RunSliceResult,
    Assignment,
    SliceRequest,
    newTestSlice,
} from '@terascope/job-components';
import BaseTestHarness from './base-test-harness';
import { JobHarnessOptions } from './interfaces';

/**
 * A Teraslice Test Harness for testing the Operations
 * ran on the Worker and an associated lifecycle events.
 *
 * @todo Add support for lifecycle events
 * @todo Add support for attaching APIs and Observers
*/
export default class WorkerTestHarness extends BaseTestHarness<WorkerContext, WorkerExecutionContext> {
    constructor(job: JobConfig, options: JobHarnessOptions) {
        super(job, options, Assignment.Worker);
    }

    get fetcher() {
        return this.executionContext.fetcher;
    }

    get processors() {
        return [...this.executionContext.processors];
    }

    /**
     * Initialize the Operations on the ExecutionContext
    */
    async initialize() {
        await super.initialize();
        await this.executionContext.initialize();
    }

    /**
     * Given a slice run pass it the Fetcher and then subsequent
     * operations. This will also fire lifecycle events
     * which may be triggered any extra APIs.
     *
     * @param input The input slice, can optionally include all of the slice metadata.
     * Use `newTestSlice()` to create a test slice.
     * @param options an optional object of additional configruation
     * @param options.fullResponse if specified it will return an object
     * with both the slice results and any analytics if specified on the Job.
     *
     * @returns an Array of DataEntities or a SliceResult
    */
    async runSlice(input: Slice|SliceRequest, { fullResponse = false } = {}): Promise<DataEntity[]|RunSliceResult> {
        const slice: Slice = isSlice(input) ? input : newTestSlice(input);

        this.events.emit('slice:initialize', slice);
        await this.executionContext.onSliceInitialized(slice.slice_id);

        let result: RunSliceResult;

        try {
            result = await this.executionContext.runSlice(slice);
        } catch (err) {
            this.events.emit('slice:failure', slice);
            await this.executionContext.onSliceFailed(slice.slice_id);
            throw err;
        } finally {
            this.events.emit('slice:finalize', slice);
            await this.executionContext.onSliceFinalizing(slice.slice_id);
        }

        this.events.emit('slice:success', slice);
        this.executionContext.onSliceFinished(slice.slice_id);

        if (fullResponse) {
            return result || {
                results: [],
            };
        }

        return result.results || [];
    }

    /**
     * Shutdown the Operations on the ExecutionContext
    */
    async shutdown() {
        await super.shutdown();
        await this.executionContext.shutdown();
    }
}

function isSlice(input: Slice|SliceRequest): input is Slice {
    return input.slice_id && input.slicer_id != null;
}

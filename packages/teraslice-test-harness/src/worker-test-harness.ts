import {
    WorkerExecutionContext,
    JobConfig,
    Slice,
    DataEntity,
    RunSliceResult,
    SliceRequest,
    newTestSlice,
    FetcherCore,
    OperationCore,
} from '@terascope/job-components';
import BaseTestHarness from './base-test-harness';
import { JobHarnessOptions } from './interfaces';

/**
 * A test harness for testing Operations that run on Workers,
 * mainly Fetchers and Processors.
 *
 * This is useful for testing Fetcher and Processors together or individually.
 *
 * @todo Add support for attaching APIs and Observers
*/
export default class WorkerTestHarness extends BaseTestHarness<WorkerExecutionContext> {
    constructor(job: JobConfig, options: JobHarnessOptions) {
        super(job, options, 'worker');
    }

    fetcher<T extends FetcherCore = FetcherCore>(): T {
        return this.executionContext.fetcher<T>();
    }

    get processors() {
        return this.executionContext.processors;
    }

    get apis() {
        return this.executionContext.apis;
    }

    getOperation<T extends OperationCore = OperationCore>(findBy: string|number): T {
        return this.executionContext.getOperation<T>(findBy);
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
    async runSlice(input: Slice|SliceRequest): Promise<DataEntity[]>;
    async runSlice(input: Slice|SliceRequest, options: { fullResponse: false }): Promise<DataEntity[]>;
    async runSlice(input: Slice|SliceRequest, options: { fullResponse: true }): Promise<RunSliceResult>;
    async runSlice(input: Slice|SliceRequest, { fullResponse = false } = {}): Promise<DataEntity[]|RunSliceResult> {
        const maxRetries = this.executionContext.config.max_retries;
        const remainingTries = Number.isInteger(maxRetries) ? maxRetries + 1 : 0;
        const slice: Slice = isSlice(input) ? input : newTestSlice(input);

        this.events.emit('slice:initialize', slice);
        await this.executionContext.onSliceInitialized(slice.slice_id);

        let result: RunSliceResult;

        try {
            result = await this._trySlice(slice, remainingTries);
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

    private async _trySlice(slice: Slice, remainingTries: number): Promise<RunSliceResult> {
        try {
            return await this.executionContext.runSlice(slice);
        } catch (err) {
            this.context.logger.error('Slice Failure', err, slice);
            if (remainingTries > 0) {
                this.events.emit('slice:retry', slice);
                await this.executionContext.onSliceRetry(slice.slice_id);
                return this._trySlice(slice, remainingTries - 1);
            }

            this.events.emit('slice:failure', slice);
            await this.executionContext.onSliceFailed(slice.slice_id);
            throw err;
        }
    }
}

function isSlice(input: Slice|SliceRequest): input is Slice {
    return input.slice_id && input.slicer_id != null;
}

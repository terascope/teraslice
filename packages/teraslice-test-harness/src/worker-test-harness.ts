import {
    WorkerExecutionContext,
    JobConfigParams,
    Slice,
    RunSliceResult,
    SliceRequest,
    newTestSlice,
    FetcherCore,
    OperationCore,
    APICore,
    OpConfig,
    newTestJobConfig,
    OpAPI,
} from '@terascope/job-components';
import { DataEntity } from '@terascope/entity-utils';
import BaseTestHarness from './base-test-harness.js';
import { JobHarnessOptions } from './interfaces.js';

/**
 * A test harness for testing Operations that run on Workers,
 * mainly Fetchers and Processors.
 *
 * This is useful for testing Fetcher and Processors together or individually.
 *
 * @todo Add support for attaching APIs and Observers
 */
export default class WorkerTestHarness extends BaseTestHarness<WorkerExecutionContext> {
    constructor(job: JobConfigParams, options: JobHarnessOptions = {}) {
        super(job, options, 'worker');
    }

    static testProcessor(opConfig: OpConfig, options?: JobHarnessOptions): WorkerTestHarness {
        const job = newTestJobConfig({
            max_retries: 0,
            operations: [
                {
                    _op: 'test-reader',
                    passthrough_slice: true,
                },
                opConfig,
            ],
        });
        return new WorkerTestHarness(job, options);
    }

    static testFetcher(opConfig: OpConfig, options?: JobHarnessOptions): WorkerTestHarness {
        const job = newTestJobConfig({
            max_retries: 0,
            operations: [
                opConfig,
                {
                    _op: 'noop',
                },
            ],
        });
        return new WorkerTestHarness(job, options);
    }

    fetcher<T extends FetcherCore = FetcherCore>(): T {
        return this.executionContext.fetcher<T>();
    }

    get processors(): WorkerExecutionContext['processors'] {
        return this.executionContext.processors;
    }

    get apis(): WorkerExecutionContext['apis'] {
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
     * Get the instantiated Operation class instance from the operations list
    */
    getOperation<T extends OperationCore = OperationCore>(findBy: string | number): T {
        return this.executionContext.getOperation<T>(findBy);
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
     * Initialize the Operations on the ExecutionContext
     */
    async initialize(): Promise<void> {
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
    async runSlice(
        input: Slice | SliceRequest
    ): Promise<DataEntity[]>;
    async runSlice(
        input: Slice | SliceRequest,
        options: { fullResponse: false }
    ): Promise<DataEntity[]>;
    async runSlice(
        input: Slice | SliceRequest,
        options: { fullResponse: true }
    ): Promise<RunSliceResult>;
    async runSlice(
        input: Slice | SliceRequest,
        { fullResponse = false } = {}
    ): Promise<DataEntity[] | RunSliceResult> {
        const slice: Slice = isSlice(input) ? input : newTestSlice(input);

        await this.executionContext.initializeSlice(slice);

        let result: RunSliceResult;

        try {
            result = await this.executionContext.runSlice();
            this.events.emit('slice:success', slice);
        } finally {
            await this.executionContext.onSliceFinalizing();
        }

        await this.executionContext.onSliceFinished();

        if (fullResponse) {
            return (
                result || {
                    results: [],
                }
            ) as RunSliceResult;
        }

        return result.results || [];
    }

    /**
     * Shutdown the Operations on the ExecutionContext
     */
    async flush(): Promise<DataEntity[] | undefined>;
    async flush(options: { fullResponse: false }): Promise<DataEntity[] | undefined>;
    async flush(options: { fullResponse: true }): Promise<RunSliceResult | undefined>;
    async flush({ fullResponse = false } = {}): Promise<DataEntity[] | RunSliceResult | undefined> {
        const response = await this.executionContext.flush();
        if (response != null) {
            if (fullResponse) return response;
            return response.results;
        }
        // its undefined or null here
        return response;
    }
}

function isSlice(input: Slice | SliceRequest): input is Slice {
    return input.slice_id && input.slicer_id != null;
}

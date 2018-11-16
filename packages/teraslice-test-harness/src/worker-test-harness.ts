import {
    WorkerExecutionContext,
    WorkerContext,
    JobConfig,
    Slice,
    DataEntity,
    RunSliceResult,
} from '@terascope/job-components';
import BaseTestHarness from './base-test-harness';
import { JobHarnessOptions, TestMode } from './interfaces';

/**
 * A Teraslice Test Harness for testing the Operations
 * ran on the Worker and an associated lifecycle events.
 *
 * @todo Add support for lifecycle events
 * @todo Add support for attaching APIs and Observers
*/
export default class WorkerTestHarness extends BaseTestHarness {
    protected executionContext: WorkerExecutionContext;
    protected context: WorkerContext;

    constructor(job: JobConfig, options: JobHarnessOptions) {
        super(TestMode.Worker);

        const config = this.makeContextConfig(job, options.assetDir);
        this.executionContext = new WorkerExecutionContext(config);
        this.context = this.executionContext.context;

        this.setClients(options.clients);
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
     * @param slice The input slice, must include all of the slice metadata.
     * Use `newTestSlice()` to create a test slice.
     * @param options an optional object of additional configruation
     * @param options.fullResponse if specified it will return an object
     * with both the slice results and any analytics if specified on the Job.
     *
     * @returns an Array of DataEntities or a SliceResult
    */
    async runSlice(slice: Slice, { fullResponse = false } = {}): Promise<DataEntity[]|RunSliceResult> {
        const result = await this.executionContext.runSlice(slice);
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

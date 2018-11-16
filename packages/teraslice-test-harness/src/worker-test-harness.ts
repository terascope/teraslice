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

export default class WorkerTestHarness extends BaseTestHarness {
    protected executionContext: WorkerExecutionContext;
    protected context: WorkerContext;

    constructor(job: JobConfig, options: JobHarnessOptions) {
        super(TestMode.Worker);

        const config = this.makeContextConfig(job);
        this.executionContext = new WorkerExecutionContext(config);
        this.context = this.executionContext.context;

        this.setClients(options.clients);
    }

    async initialize() {
        await super.initialize();
        await this.executionContext.initialize();
    }

    async runSlice(slice: Slice, { fullResponse = false } = {}): Promise<DataEntity[]|RunSliceResult> {
        const result = await this.executionContext.runSlice(slice);
        if (fullResponse) {
            return result || {
                results: [],
            };
        }

        return result.results || [];
    }

    async shutdown() {
        await super.shutdown();
        await this.executionContext.shutdown();
    }
}

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
        return this.context;
    }
}

export interface JobHarnessOptions {
    assignment?: Assignment;
    assetDir: string;
}

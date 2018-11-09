import {
    Context,
    TestContext,
    JobConfig,
    Assignment,
    validateJobConfig,
    jobSchema,
    ValidatedJobConfig
} from '@terascope/job-components';

export default class JobHarness {
    protected context: Context;
    protected jobConfig: ValidatedJobConfig;

    constructor(job: JobConfig, assignment: Assignment = Assignment.Worker) {
        this.context = new TestContext(`job-harness:${job.name}`);
        this.context.assignment = assignment;
        this.jobConfig = validateJobConfig(jobSchema(this.context), job);
    }

    async initialize() {

    }
}

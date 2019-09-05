import { isString, JobConfig, TSError } from '@terascope/job-components';
import autoBind from 'auto-bind';
import Client from './client';
import Job from './job';
import {
    ClientConfig,
    JobsGetResponse,
    SearchOptions,
    JobSearchParams,
    JobListStatusQuery
} from './interfaces';

export default class Jobs extends Client {
    constructor(config: ClientConfig) {
        super(config);
        // @ts-ignore
        autoBind(this);
    }

    async submit(jobSpec: JobConfig, shouldNotStart?: boolean) {
        if (!jobSpec) throw new TSError('submit requires a jobSpec');
        const job = await this.post('/jobs', jobSpec, { query: { start: !shouldNotStart } });
        return this.wrap(job.job_id);
    }

    async list(
        status?: JobListStatusQuery,
        searchOptions: SearchOptions = {}
    ): Promise<JobsGetResponse> {
        const query = _parseListOptions(status);
        return this.get('/jobs', this.makeOptions(query, searchOptions));
    }

    // Wraps the job_id with convenience functions for accessing
    // the state on the server.
    wrap(jobId: string) {
        return new Job(this._config, jobId);
    }
}

function _parseListOptions(options?: JobListStatusQuery): JobSearchParams {
    // support legacy
    if (!options) return { status: '*' };
    if (isString(options)) return { status: options };
    return options;
}

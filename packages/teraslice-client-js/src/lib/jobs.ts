
import { isString, JobConfig, TSError } from '@terascope/job-components';
import Client from './client';
import Job from './job';
import {
    JobsGetResponse,
    SearchOptions,
    JobSearchParams,
    JobListStatusQuery
} from '../interfaces';

export default class Jobs extends Client {

    async submit(jobSpec:JobConfig, shouldNotStart?:boolean) {
        if (!jobSpec) throw new TSError('submit requires a jobSpec');
        const job = await this.post('/jobs', jobSpec, { query: { start: !shouldNotStart } });
        return this.wrap(job.job_id);
    }

    async list(status?: JobListStatusQuery, searchOptions: SearchOptions = {}):Promise<JobsGetResponse> {
        const query = _parseListOptions(status);
        const options = Object.assign({}, searchOptions, { query });
        return this.get('/jobs', options);
    }

    // Wraps the job_id with convenience functions for accessing
    // the state on the server.
    wrap(jobId:string) {
        return new Job(this._config, jobId);
    }
}

function _parseListOptions(options?:JobListStatusQuery): JobSearchParams {
    // support legacy
    if (!options) return { status: '*' };
    if (isString(options)) return { status: options };
    return options;
}

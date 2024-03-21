import { isString, TSError } from '@terascope/utils';
import { Teraslice } from '@terascope/types';
import autoBind from 'auto-bind';
import Client from './client.js';
import Job from './job.js';
import { SearchOptions, ClientConfig } from './interfaces.js';

export default class Jobs extends Client {
    constructor(config: ClientConfig) {
        super(config);
        autoBind(this);
    }

    async submit(jobSpec: Teraslice.JobConfig, shouldNotStart?: boolean): Promise<Job> {
        if (!jobSpec) {
            throw new TSError('Submit requires a jobSpec', {
                statusCode: 400
            });
        }

        const job: Teraslice.ApiJobCreateResponse = await this.post('/jobs', jobSpec, {
            searchParams: { start: !shouldNotStart }
        });

        return this.wrap(job.job_id);
    }

    async list(
        status?: Teraslice.JobListStatusQuery,
        searchOptions: SearchOptions = {}
    ): Promise<Teraslice.JobRecord[]> {
        const query = _parseListOptions(status);
        return this.get('/jobs', this.makeOptions(query, searchOptions));
    }

    /**
     * Wraps the job_id with convenience functions for accessing
     * the state on the server.
    */
    wrap(jobId: string): Job {
        return new Job(this._config, jobId);
    }
}

function _parseListOptions(options?: Teraslice.JobListStatusQuery): Teraslice.JobSearchParams {
    // support legacy
    if (!options) return { status: '*' };
    if (isString(options)) return { status: options };
    return options;
}

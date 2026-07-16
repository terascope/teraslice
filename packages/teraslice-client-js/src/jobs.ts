import { TSError } from '@terascope/core-utils';
import { Teraslice } from '@terascope/types';
import autoBind from 'auto-bind';
import Client from './client.js';
import Job from './job.js';
import { RequestOptions, ClientConfig } from './interfaces.js';

export default class Jobs extends Client {
    constructor(config: ClientConfig) {
        super(config);
        autoBind(this);
    }

    async submit(jobSpec: Teraslice.JobConfigParams, shouldNotStart?: boolean): Promise<Job> {
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

    // TODO: Teraslice v4 this exists to avoid a breaking change to submit() which returns just
    // the Job. This is only used by teraslice-cli. In Teraslice v4, submit() should
    // be updated to return warnings and this method removed.
    async submitWithWarnings(
        jobSpec: Teraslice.JobConfigParams,
        shouldNotStart?: boolean
    ): Promise<{ job: Job; warnings: Teraslice.JobWarning[] }> {
        if (!jobSpec) {
            throw new TSError('Submit requires a jobSpec', {
                statusCode: 400
            });
        }

        const response: Teraslice.ApiJobCreateResponse = await this.post('/jobs', jobSpec, {
            searchParams: { start: !shouldNotStart }
        });

        return {
            job: this.wrap(response.job_id),
            warnings: response.warnings ?? []
        };
    }

    async list(
        query?: Teraslice.JobSearchParams,
        searchOptions: RequestOptions = {}
    ): Promise<Teraslice.JobConfig[]> {
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

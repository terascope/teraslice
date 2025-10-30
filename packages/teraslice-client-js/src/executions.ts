import {
    isString, isPlainObject, TSError, unset
} from '@terascope/core-utils';
import { Teraslice } from '@terascope/types';
import autoBind from 'auto-bind';
import Client from './client.js';
import Ex from './ex.js';
import { ClientConfig, RequestOptions } from './interfaces';

type ListOptions = undefined | string | Teraslice.SearchQuery;

export default class Executions extends Client {
    constructor(config: ClientConfig) {
        super(config);
        autoBind(this);
    }

    /**
     * Similar to jobs.submit but returns an instance of Ex not a Job
    */
    async submit(jobSpec: Teraslice.JobConfigParams, shouldNotStart?: boolean): Promise<Ex> {
        if (!jobSpec) {
            throw new TSError('Submit requires a jobSpec', {
                statusCode: 400
            });
        }
        const job: Teraslice.ApiJobCreateResponse = await this.post('/jobs', jobSpec, {
            searchParams: { start: !shouldNotStart }
        });
        // support older version of teraslice
        if (!job.ex_id) {
            const { ex_id: exId } = await this.get(`/jobs/${job.job_id}/ex`);
            return this.wrap(exId);
        }

        return this.wrap(job.ex_id);
    }

    async list(options?: ListOptions): Promise<Teraslice.ExecutionConfig[]> {
        const query = _parseListOptions(options);
        return this.get('/ex', { searchParams: query } as RequestOptions);
    }

    async errors(
        exId?: string | Teraslice.SearchQuery,
        opts?: Teraslice.SearchQuery
    ): Promise<Teraslice.ErrorRecord[]> {
        const options: Teraslice.SearchQuery = {};
        if (isString(exId)) {
            if (isPlainObject(opts)) {
                options.searchParams = opts;
            }

            return this.get(`/ex/${exId}/errors`, options as RequestOptions);
        }

        if (isPlainObject(exId)) {
            options.searchParams = exId;
        }

        return this.get('/ex/errors', options as RequestOptions);
    }

    /**
     * Wraps the execution id with convenience functions for accessing
     * the state on the server.
    */
    wrap(exId: string): Ex {
        return new Ex(this._config, exId);
    }
}

function _parseListOptions(options: ListOptions): Teraslice.SearchQuery {
    // support legacy
    if (!options) return {};
    if (isString(options)) {
        if (options === '*') return {};
        return { status: options };
    }
    if (options.status === '*') unset(options, 'status');
    return options;
}

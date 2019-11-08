import {
    isString,
    isPlainObject,
} from '@terascope/job-components';
import autoBind from 'auto-bind';
import Client from './client';
import Ex from './ex';

import {
    ClientConfig,
    SearchQuery,
    SearchOptions,
    StateErrors,
    ExecutionGetResponse,
} from './interfaces';

type ListOptions = undefined | string | SearchQuery;

export default class Executions extends Client {
    constructor(config: ClientConfig) {
        super(config);
        // @ts-ignore
        autoBind(this);
    }

    async list(options?: ListOptions): Promise<ExecutionGetResponse> {
        const query = _parseListOptions(options);
        return this.get('/ex', { query } as SearchOptions);
    }

    async errors(exId?: string | SearchQuery, opts?: SearchQuery): Promise<StateErrors> {
        const options: SearchQuery = {};
        if (isString(exId)) {
            if (isPlainObject(opts)) {
                options.query = opts;
            }

            return this.get(`/ex/${exId}/errors`, options as SearchOptions);
        }

        if (isPlainObject(exId)) {
            options.query = exId;
        }

        return this.get('/ex/errors', options as SearchOptions);
    }

    /**
     * Wraps the execution id with convenience functions for accessing
     * the state on the server.
    */
    wrap(exId: string) {
        return new Ex(this._config, exId);
    }
}

function _parseListOptions(options: ListOptions): SearchQuery {
    // support legacy
    if (!options) return { status: '*' };
    if (isString(options)) return { status: options };
    return options;
}

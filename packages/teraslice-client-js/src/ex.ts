import { isString, isPlainObject, TSError } from '@terascope/job-components';
import autoBind from 'auto-bind';
import Client from './client';

import {
    ClientConfig,
    SearchQuery,
    SearchOptions,
    PausedResponse,
    StoppedResponse,
    StopQuery,
    ResumeResponse,
    ExecutionStatus,
    ExecutionGetResponse,
    StateErrors
} from './interfaces';

type ListOptions = undefined | string | SearchQuery;

export default class Ex extends Client {
    constructor(config: ClientConfig) {
        super(config);
        // @ts-ignore
        autoBind(this);
    }

    async stop(exId: string, query?: StopQuery): Promise<StoppedResponse> {
        validateExId(exId);
        return this.post(`/ex/${exId}/_stop`, null, { query });
    }

    async pause(exId: string, query?: SearchQuery): Promise<PausedResponse> {
        validateExId(exId);
        return this.post(`/ex/${exId}/_pause`, null, { query });
    }

    async resume(exId: string, query?: SearchQuery): Promise<ResumeResponse> {
        validateExId(exId);
        return this.post(`/ex/${exId}/_resume`, null, { query });
    }

    async status(exId: string): Promise<ExecutionStatus> {
        validateExId(exId);
        const { _status: status } = await this.get(`/ex/${exId}`);
        return status;
    }

    async list(options?: ListOptions): Promise<ExecutionGetResponse> {
        const query = _parseListOptions(options);
        return this.get('/ex', { query } as SearchOptions);
    }

    async errors(exId: string | SearchQuery, opts?: SearchQuery): Promise<StateErrors> {
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
}

function validateExId(exId: string) {
    if (!exId) {
        throw new TSError('Ex requires exId');
    }
    if (!isString(exId)) {
        throw new TSError('Ex requires exId to be a string');
    }
}

function _parseListOptions(options: ListOptions): SearchQuery {
    // support legacy
    if (!options) return { status: '*' };
    if (isString(options)) return { status: options };
    return options;
}

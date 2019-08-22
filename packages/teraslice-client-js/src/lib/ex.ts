
import { isString, isPlainObject, TSError } from '@terascope/job-components';
import Client from './client';
import { SearchParams } from '../interfaces';

type ListOptions = undefined | string | SearchParams;

export default class Ex extends Client {

    async stop(exId: string, query?: SearchParams) {
        validateExId(exId);
        return this.post(`/ex/${exId}/_stop`, { query });
    }

    async pause(exId: string, query?: SearchParams) {
        validateExId(exId);
        return this.post(`/ex/${exId}/_pause`, { query });
    }

    async resume(exId: string, query?: SearchParams) {
        validateExId(exId);
        return this.post(`/ex/${exId}/_resume`, { query });
    }

    async status(exId: string) {
        validateExId(exId);
        const { _status: status } =  await this.get(`/ex/${exId}`);
        return status;
    }

    async list(options?: ListOptions) {
        const query = _parseListOptions(options);
        return this.get('/ex', { query });
    }

    async errors(exId: string | SearchParams, opts?: SearchParams) {
        const options: SearchParams = {};
        if (isString(exId)) {
            if (isPlainObject(opts)) {
                 // @ts-ignore
                options.query = opts;
            }
            return this.get(`/ex/${exId}/errors`, options);
        }

        if (isPlainObject(exId)) {
            options.query = exId;
        }
        return this.get('/ex/errors', options);
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

function _parseListOptions(options: ListOptions):SearchParams {
    // support legacy
    if (!options) return { status: '*' };
    if (isString(options)) return { status: options };
    return options;
}

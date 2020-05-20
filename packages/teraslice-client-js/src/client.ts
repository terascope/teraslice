import {
    isString,
    TSError,
    isPlainObject,
    isTest,
    trimStart
} from '@terascope/job-components';
import { STATUS_CODES } from 'http';
import { URL } from 'url';
import got, { Got } from 'got';
import { ClientConfig, SearchOptions, RequestOptions } from './interfaces';

export default class Client {
    private readonly _apiVersion: string;
    private readonly _request: Got;
    protected readonly _config: ClientConfig;

    constructor(config: ClientConfig = {}) {
        const configUrl = new URL(config.host || config.baseUrl || 'http://localhost:5678');
        configUrl.pathname = '';
        configUrl.hash = '';
        const prefixUrl = configUrl.toString();
        const { apiVersion = '/v1' } = config;

        this._config = config;
        this._apiVersion = apiVersion;
        this._request = got.extend({
            prefixUrl,
            headers: {
                'User-Agent': 'Teraslice Client',
                Accept: 'application/json',
            },
            retry: {
                limit: isTest ? 0 : 3,
                maxRetryAfter: 15000 // 15 seconds
            },
            timeout: config.timeout,
            responseType: 'json'
        });
    }

    async get(endpoint: string, options?: SearchOptions) {
        return this._makeRequest('get', endpoint, options);
    }

    async post(endpoint: string, data: any, options?: RequestOptions) {
        return this._makeRequest('post', endpoint, options, data);
    }

    async put(endpoint: string, data: any, options?: RequestOptions) {
        return this._makeRequest('put', endpoint, options, data);
    }

    async delete(endpoint: string, options?: SearchOptions) {
        return this._makeRequest('delete', endpoint, options);
    }

    private async _makeRequest(
        method: string,
        endpoint: string,
        searchOptions: SearchOptions = {},
        data?: any
    ) {
        const errorMsg = validateRequestOptions(endpoint, searchOptions);
        if (errorMsg) return Promise.reject(new TSError(errorMsg));

        let options;
        if (data) {
            options = getRequestOptionsWithData(data, searchOptions);
        } else {
            options = searchOptions;
        }

        const newEndpoint = getAPIEndpoint(endpoint, this._apiVersion);
        try {
            const response = await this._request[method](newEndpoint, options);
            const { body } = response;
            return body;
        } catch (err) {
            const { statusCode } = err;

            if (statusCode >= 400) {
                const error = makeErrorFromResponse(err);
                throw error;
            }

            // TODO: what additional parameters should we return here?
            throw new TSError(err);
        }
    }

    protected parse(results: any) {
        if (typeof results === 'string') return JSON.parse(results);
        return results;
    }

    // TODO: make better types for this
    protected makeOptions(
        searchParams: Record<string, any>|undefined, options: RequestOptions | SearchOptions
    ) {
        return { ...options, searchParams };
    }
}

function getAPIEndpoint(uri: string, apiVersion: string) {
    // remove start and ending slash
    const endpoint = uri ? uri.trim().replace(/(^\/)|(\/$)/, '') : '';
    if (!apiVersion) return endpoint;
    const txtIndex = endpoint.indexOf('txt');
    const isTxt = txtIndex < 2 && txtIndex > -1;
    if (isTxt) return endpoint;
    if (endpoint.indexOf(apiVersion) > -1) return endpoint;
    return `${trimStart(apiVersion, '/')}/${endpoint}`;
}

function getErrorFromResponse(response: any) {
    let { body } = response;

    if (body && isString(body)) {
        try {
            body = JSON.parse(body);
        } catch (err) {
            return { message: body };
        }
    }

    if (body && isPlainObject(body)) {
        if (isString(body.error)) {
            return {
                message: body.error
            };
        }
        return {
            message: body.message,
            code: body.error
        };
    }
    return {};
}

interface OldErrorOutput extends TSError {
    error: number;
    code: string;
    statusCode: number;
}

function makeErrorFromResponse(response: any): OldErrorOutput {
    const { statusCode } = response;
    const stuff = getErrorFromResponse(response);
    const {
        message = STATUS_CODES[statusCode],
        code = statusCode
    } = stuff;
    const error: Partial<OldErrorOutput> = new TSError(message);
    error.error = code; // for legacy support
    error.code = code;
    error.statusCode = code;
    return error as OldErrorOutput;
}

// TODO: do more validations
function validateRequestOptions(endpoint: string, _options?: SearchOptions) {
    if (!endpoint) {
        return 'endpoint must not be empty';
    }
    if (!isString(endpoint)) {
        return 'endpoint must be a string';
    }
    return null;
}

function getRequestOptionsWithData(data: any, options: SearchOptions) {
    if (isPlainObject(data) || Array.isArray(data)) {
        return Object.assign({}, options, { body: data });
    }
    return Object.assign({}, options, { body: data, json: false });
}

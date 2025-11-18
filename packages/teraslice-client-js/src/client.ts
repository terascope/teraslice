import {
    isString, TSError, isPlainObject,
    isTest, trimStart, tryParseJSON,
    withoutNil,
} from '@terascope/core-utils';
import { STATUS_CODES } from 'node:http';
import { URL } from 'node:url';
import got, { type Got, HTTPError } from 'got';
import { ClientConfig, RequestOptions } from './interfaces.js';

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
            timeout: {
                request: config.timeout
            },
            responseType: 'json'
        });
    }

    async get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
        return this._makeRequest<T>('get', endpoint, options);
    }

    async post<T = any>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
        return this._makeRequest<T>('post', endpoint, options, data);
    }

    async put<T = any>(endpoint: string, data: unknown, options?: RequestOptions): Promise<T> {
        return this._makeRequest<T>('put', endpoint, options, data);
    }

    async delete<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
        return this._makeRequest<T>('delete', endpoint, options);
    }

    private async _makeRequest<T = any>(
        method: 'get' | 'post' | 'put' | 'delete',
        endpoint: string,
        searchOptions?: RequestOptions,
        data?: any
    ): Promise<T> {
        const errorMsg = validateRequestOptions(endpoint, searchOptions);
        if (errorMsg) {
            return Promise.reject(new TSError(errorMsg, {
                statusCode: 422
            }));
        }

        let options: RequestOptions;
        if (data != null && method.toLowerCase() !== 'get') {
            options = getRequestOptionsWithData(data, searchOptions ?? {});
        } else {
            options = { ...searchOptions };
        }

        // migrate to using searchParams
        if ((options as any).query) {
            options.searchParams = (options as any).query;
            delete (options as any).query;
        }

        // got doesn't like `undefined` values in the search params
        // so we need to remove them
        if (isPlainObject(options.searchParams)) {
            options.searchParams = withoutNil(options.searchParams as any);
        }

        const newEndpoint = getAPIEndpoint(endpoint, this._apiVersion);
        try {
            return await this._request[method](newEndpoint, {
                resolveBodyOnly: true,
                throwHttpErrors: true,
                ...options,
            } as any) as any as T;
        } catch (err) {
            if (err instanceof HTTPError) {
                throw makeErrorFromResponse(err.response);
            }

            throw err;
        }
    }

    protected parse(results: unknown): any {
        return tryParseJSON(results);
    }

    protected makeOptions(
        searchParams: Record<string, any> | undefined, options: RequestOptions
    ): RequestOptions {
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

    const versionPrefix = trimStart(apiVersion, '/');
    if (endpoint.startsWith(versionPrefix)) return endpoint;
    return `${versionPrefix}/${endpoint}`;
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
    const parsedError = getErrorFromResponse(response);
    const {
        message = STATUS_CODES[statusCode],
        code = statusCode
    } = parsedError;

    const error: Partial<OldErrorOutput> = new Error(message);

    error.error = code; // for legacy support
    error.code = code;
    error.statusCode = code;

    return error as OldErrorOutput;
}

// TODO: do more validations
function validateRequestOptions(endpoint: string, _options?: RequestOptions) {
    if (!endpoint) {
        return 'endpoint must not be empty';
    }
    if (!isString(endpoint)) {
        return 'endpoint must be a string';
    }
    return null;
}

function getRequestOptionsWithData(
    data: any, options: RequestOptions
): RequestOptions {
    if (isPlainObject(data) || Array.isArray(data)) {
        return { ...options, json: data };
    }
    return { ...options, body: data };
}

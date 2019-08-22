
import { isString, TSError, isPlainObject, has } from '@terascope/job-components';
import got from 'got';
import { STATUS_CODES } from 'http';
import { URL } from 'url';
import path from 'path';
import { ClientConfig, QueryOptions } from '../interfaces';

export default class Client {
    private _apiVersion:string;
    private _request: got.GotInstance;
    protected _config:ClientConfig;

    constructor(config: ClientConfig = {}) {
        const configUrl = new URL(config.host || config.baseUrl || 'http://localhost:5678');
        configUrl.pathname = '';
        configUrl.hash = '';
        const baseUrl = configUrl.toString();
        const { apiVersion = '/v1' } = config;
        this._config = config;
        this._apiVersion = apiVersion;
        this._request = got.extend({
            baseUrl,
            headers: {
                'User-Agent': 'Teraslice Client',
                Accept: 'application/json'
            },
            timeout: config.timeout,
            json: true
        });
    }

    async get(endpoint: string, options?:QueryOptions) {
        return this._makeRequest('get', endpoint, options);
    }

    async post(endpoint: string, data: any, options?:QueryOptions) {
        // console.log('should have options', options)
        return this._makeRequest('post', endpoint, options, data);
    }
    // TODO: this should have data as well
    async put(endpoint: string, data: any, options?:QueryOptions) {
        return this._makeRequest('put', endpoint, options, data);
    }

    async delete(endpoint: string, options?:QueryOptions) {
        return this._makeRequest('delete', endpoint, options);
    }
    // @ts-ignore
    private async _makeRequest(method:string, endpoint:string, queryOptions: QueryOptions = {}, data?:any) {
        // console.log('starting call', method, endpoint, queryOptions, data)
        const errorMsg = validateRequestOptions(endpoint, queryOptions);
        if (errorMsg) return Promise.reject(new TSError(errorMsg));
        let options;
        if (data) {
            options = getRequestOptionsWithData(data, queryOptions);
        } else {
            options = queryOptions; // getRequestOptionsWithQuery(queryOptions);
        }
        // console.log('after convergence', options)

        // console.log('method', method)
        // console.log('endpoint', endpoint)
        // console.log('queryOptions', queryOptions)
        // console.log('data', data)

        // let options;
        // if (rest.length > 0) {
        //     if (method === 'get') {
        //         options = getRequestOptionsWithQuery(...rest);
        //     } else {
        //         options = getRequestOptionsWithData(...rest);
        //     }
        // }
        const newEndpoint = getAPIEndpoint(endpoint, this._apiVersion);
        // console.log('the call', method, newEndpoint, options)
        // console.log('teh parsed stuff', new URLSearchParams(options.query).toString())
        try {
            const response = await this._request[method](newEndpoint, options);
            const { body } = response;
            let results = body;
            // console.log('what are results', results)
            if (typeof results === 'string' && method !== 'get') {
                results = JSON.parse(results);
            }

            return results;
        } catch (err) {
            const { statusCode } = err;

            if (statusCode >= 400) {
                const error = makeErrorFromResponse(err);
                // console.log('what is the error here in >400', error)
                throw error;
            }
            // TODO: what additional parameters should we return here?
            throw new TSError(err.message);
        }
    }
}

function getAPIEndpoint(endpoint:string, apiVersion:string) {
    if (!apiVersion) return endpoint;
    const txtIndex = endpoint.indexOf('txt');
    const isTxt = txtIndex < 2 && txtIndex > -1;
    if (isTxt) return endpoint;
    if (endpoint.indexOf(apiVersion) > -1) return endpoint;
    return path.join(apiVersion, endpoint);
}

 // @ts-ignore
function getErrorFromResponse(response) {
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

// TODO: type this up
// @ts-ignore
function makeErrorFromResponse(response:any) {
    const { statusCode } = response;
    const stuff = getErrorFromResponse(response);
    const {
        message = STATUS_CODES[statusCode],
        code = statusCode
    } = stuff;
    const error = new TSError(message);
     // @ts-ignore
    error.error = code; // for legacy support
     // @ts-ignore
    error.code = code;
     // @ts-ignore
    error.statusCode = code;
    return error;
}

// TODO: do more validations
function validateRequestOptions(endpoint:string, options?: QueryOptions) {
    if (!endpoint) {
        return 'endpoint must not be empty';
    }
    if (!isString(endpoint)) {
        return 'endpoint must be a string';
    }
    // if (rest.length > 2) {
    //     return 'Too many arguments passed to client';
    // }
    return null;
}
// @ts-ignore
function isRequestOptions(input:any) {
    if (!isPlainObject(input)) return false;
    if (has(input, 'qs')) return true;
    if (has(input, 'body')) return true;
    if (has(input, 'headers')) return true;
    if (has(input, 'json')) return true;
    return false;
}
 // @ts-ignore
function getRequestOptionsWithData(data: any, options:QueryOptions) {
    // if (isRequestOptions(rest[0])) {
    //     return rest[0];
    // }
    if (isPlainObject(data) || Array.isArray(data)) {
        return Object.assign({}, options, { body: data });
    }
    return Object.assign({}, options, { body: data, json: false });
}
 // @ts-ignore
// function getRequestOptionsWithQuery(...rest) {
//     // if (isRequestOptions(rest[0])) {
//     //     return rest[0];
//     // }
//     const [data, options = {}] = rest;
//     return Object.assign({}, options, { qs: data });
// }

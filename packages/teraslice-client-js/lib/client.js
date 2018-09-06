'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const rp = require('request-promise');
const { STATUS_CODES } = require('http');
const { URL } = require('url');

class Client {
    constructor(config = {}) {
        const baseUrl = new URL(config.host || config.baseUrl || 'http://localhost:5678');
        delete baseUrl.path;
        delete baseUrl.hash;

        this._request = rp.defaults({
            baseUrl: baseUrl.toString(),
            headers: {
                'User-Agent': 'Teraslice Client',
                Accept: 'application/json'
            },
            simple: false,
            resolveWithFullResponse: true,
            timeout: config.timeout,
            json: true
        });
    }

    get(...args) {
        return this._makeRequest('get', ...args);
    }

    post(...args) {
        return this._makeRequest('post', ...args);
    }

    put(...args) {
        return this._makeRequest('put', ...args);
    }

    delete(...args) {
        return this._makeRequest('delete', ...args);
    }

    _makeRequest(method, endpoint, ...rest) {
        const errorMsg = validateRequestOptions(endpoint, ...rest);
        if (errorMsg) return Promise.reject(new Error(errorMsg));

        let options;
        if (rest.length > 0) {
            if (method === 'get') {
                options = getRequestOptionsWithQuery(...rest);
            } else {
                options = getRequestOptionsWithData(...rest);
            }
        }

        const args = [endpoint, options];
        return handleResponse(this._request[method](...args));
    }
}

function handleResponse(req) {
    const getErrorFromResponse = (response) => {
        const { body } = response;

        if (_.isString(body)) {
            return { message: body };
        }

        if (_.isPlainObject(body)) {
            if (_.isString(body.error)) {
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
    };

    const makeErrorFromResponse = (response) => {
        const { statusCode } = response;
        const {
            message = STATUS_CODES[statusCode],
            code = statusCode
        } = getErrorFromResponse(response);

        const error = new Error(message);
        error.error = code; // for legacy support
        error.code = code;
        return error;
    };

    return req.promise()
        .catch(reason => Promise.reject(reason.error))
        .then((response) => {
            const { body, statusCode } = response;

            if (statusCode >= 400) {
                return Promise.reject(makeErrorFromResponse(response));
            }

            return Promise.resolve(body);
        });
}

function validateRequestOptions(endpoint, ...rest) {
    if (!endpoint) {
        return 'endpoint must not be empty';
    }
    if (!_.isString(endpoint)) {
        return 'endpoint must be a string';
    }
    if (rest.length > 2) {
        return 'Too many arguments passed to client';
    }
    return null;
}

function isRequestOptions(input) {
    if (!_.isPlainObject(input)) return false;
    if (_.has(input, 'qs')) return true;
    if (_.has(input, 'body')) return true;
    if (_.has(input, 'headers')) return true;
    if (_.has(input, 'json')) return true;
    return false;
}

function getRequestOptionsWithData(...rest) {
    if (isRequestOptions(rest[0])) {
        return rest[0];
    }
    const [data, options = {}] = rest;
    if (_.isPlainObject(data) || _.isArray(data)) {
        return Object.assign({}, options, { json: data });
    }
    return Object.assign({}, options, { body: data, json: false });
}

function getRequestOptionsWithQuery(...rest) {
    if (isRequestOptions(rest[0])) {
        return rest[0];
    }
    const [data, options = {}] = rest;
    return Object.assign({}, options, { qs: data });
}

module.exports = Client;

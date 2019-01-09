import semver from 'semver';
import get from 'lodash.get';
import * as es from 'elasticsearch';
import * as i from './interfaces';

export function isSimpleIndex(input?: i.IndexSchemaConfig): input is i.SimpleIndexSchema {
    return get(input, 'mapping') != null;
}

export function getMajorVersion(input: any): number {
    const v = semver.coerce(input);
    return v != null ? v.major : 1;
}

export function isValidClient(input: any): input is es.Client {
    if (input == null) return false;

    const reqKeys = [
        'indices',
        'index',
        'get',
        'search',
    ];

    return reqKeys.every((key) => input[key] != null);
}

export function isValidConfig(input: any): input is i.IndexConfig {
    if (input == null) return false;
    if (typeof input.index !== 'string') return false;
    if (!input.index) return false;
    return true;
}

export function normalizeError(err: any, stack?: string): i.ESError {
    let message = 'Unknown Error';
    let statusCode = 500;

    const errMsg = typeof err === 'string' ? err : err && err.toString();
    if (errMsg.includes('document missing') || errMsg.includes('Not Found')) {
        message = 'Not Found';
        statusCode = 404;
    }

    const error = new Error(message) as i.ESError;
    if (stack) error.stack = stack;
    error.statusCode = statusCode;

    return error;
}

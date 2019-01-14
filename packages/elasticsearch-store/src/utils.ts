import semver from 'semver';
import get from 'lodash.get';
import { parseError, isString, isFunction } from '@terascope/utils';
import * as es from 'elasticsearch';
import * as i from './interfaces';
import * as Ajv from 'ajv';

export function isSimpleIndex(input?: i.IndexSchemaConfig): input is i.SimpleIndexSchema {
    return get(input, 'mapping') != null;
}

export function isTemplatedIndex(input?: i.IndexSchemaConfig): input is i.TemplatedIndexSchema {
    return get(input, 'template') != null && !get(input, 'timeseries', false);
}

export function isTimeSeriesIndex(input?: i.IndexSchemaConfig): input is i.TimeSeriesIndexSchema {
    return get(input, 'template') != null && get(input, 'timeseries', false);
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
    if (!isString(input.index)) return false;
    if (!input.index) return false;
    return true;
}

export function normalizeError(err: any, stack?: string): i.ESError {
    let message: string;
    let statusCode = 500;

    if (err && isFunction(err.toJSON)) {
        const errObj = err.toJSON();
        message = get(errObj, 'msg', err.toString());
        statusCode = get(errObj, 'statusCode', statusCode);
    } else {
        message = parseError(err);
    }

    if (message.includes('document missing') || message.includes('Not Found')) {
        message = 'Not Found';
        statusCode = 404;
    }

    if (message.includes('document already exists')) {
        message = 'Document Already Exists';
        statusCode = 409;
    }

    const error = new Error(message) as i.ESError;
    if (stack) error.stack = stack.replace('[MESSAGE]', message);
    error.statusCode = statusCode;

    return error;
}

export function throwValidationError(errors: Ajv.ErrorObject[]|null|undefined): string|null {
    if (errors == null) return null;
    if (!errors.length) return null;

    const errorMsg = errors.map((err) => {
        return err.message;
    }).join(', ');

    const error = new Error(errorMsg) as i.ESError;
    Error.captureStackTrace(error, throwValidationError);
    error.statusCode = 422;
    throw error;
}

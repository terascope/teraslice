import * as ts from '@terascope/utils';
import * as i from './interfaces';
import * as fp from './fp-utils';

export function normalizeError(err: any): ts.TSError {
    let message = '';
    let statusCode = 500;
    let retryable = false;

    if (err && ts.isFunction(err.toJSON)) {
        const errObj = err.toJSON() as object;
        message = fp.getErrorMessage(errObj);
        statusCode = fp.getStatusCode(errObj);
    }

    if (!message) {
        message = ts.parseError(err);
    }
    if (!statusCode) {
        statusCode = fp.getStatusCode(err);
    }

    if (message.includes('document missing') || message.includes('Not Found')) {
        message = 'Not Found';
        statusCode = 404;
    }

    if (message.includes('document already exists')) {
        message = 'Document Already Exists';
        statusCode = 409;
    }

    if (message.includes('action_request_validation_exception')) {
        statusCode = 422;
    }

    if (message.includes('action_request_validation_exception')) {
        statusCode = 422;
    }

    if (message.includes('es_rejected_execution_exception')) {
        retryable = true;
    }

    if (message.indexOf('unknown error') === 0) {
        message = 'Unknown ElasticSearch Error, Cluster may be Unavailable';
        statusCode = 502;
    }

    const error = new ts.TSError(message, {
        statusCode,
        retryable,
    });

    return error;
}

export function throwValidationError(errors: i.ErrorLike[]|null|undefined): string|null {
    if (errors == null) return null;
    if (!errors.length) return null;

    const errorMsg = fp.getErrorMessages(errors);

    const error = new ts.TSError(errorMsg, {
        statusCode: 422
    });

    Error.captureStackTrace(error, throwValidationError);
    throw error;
}

export function validateIndexConfig(config: any): config is i.IndexConfig {
    const errors: string[] = [];

    if (config == null) {
        errors.push('IndexConfig cannot be empty');
    }

    if (config && (!ts.isString(config.name) || !config.name || config.name.includes('-'))) {
        errors.push('Invalid name, must be a non-empty string and cannot contain a "-"');
    }

    const {
        indexSchema = { version: 1 },
        version = 1
    } = config || {};

    if (!ts.isInteger(indexSchema.version)) {
        errors.push(`Index Version must a Integer, got "${ts.getTypeOf(indexSchema.version)}"`);
    }

    if (!ts.isInteger(version)) {
        errors.push(`Data Version must a Integer, got "${ts.getTypeOf(version)}"`);
    }

    if (indexSchema.version < 1) {
        errors.push(`Index Version must be greater than 0, got "${indexSchema.version}"`);
    }

    if (version < 1) {
        errors.push(`Data Version must be greater than 0, got "${version}"`);
    }

    if (errors.length) {
        throwValidationError(errors.map((message) => ({ message })));
    }

    return true;
}

import get from 'lodash.get';
import {
    parseError,
    isFunction,
    TSError,
} from '@terascope/utils';

export function normalizeError(err: any): TSError {
    let message: string;
    let statusCode = 500;

    if (err && isFunction(err.toJSON)) {
        const errObj = err.toJSON();
        message = get(errObj, 'msg', err.toString());
        statusCode = get(errObj, 'statusCode') || get(errObj, 'status') || statusCode;
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

    if (message.includes('action_request_validation_exception')) {
        statusCode = 422;
    }

    if (message.includes('action_request_validation_exception')) {
        statusCode = 422;
    }

    if (message.indexOf('unknown error') === 0) {
        message = 'Unknown ElasticSearch Error, Cluster may be Unavailable';
        statusCode = 502;
    }

    const error = new TSError(message, { statusCode });

    return error;
}

export function throwValidationError(errors: { message?: string }[]|null|undefined): string|null {
    if (errors == null) return null;
    if (!errors.length) return null;

    const errorMsg = errors.map((err) => {
        return err.message;
    }).join(', ');

    const error = new TSError(errorMsg, {
        statusCode: 422
    });

    Error.captureStackTrace(error, throwValidationError);
    throw error;
}

export function isRetryableError(err: any): boolean {
    return get(err, 'body.error.type') === 'es_rejected_execution_exception';
}

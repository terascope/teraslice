import get from 'lodash.get';
import {
    parseError,
    isFunction,
    TSError,
} from '@terascope/utils';

export function normalizeError(err: any, stack?: string): TSError {
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

    const error = new TSError(message, { statusCode });
    if (stack) error.stack = stack.replace('[MESSAGE]', message);

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

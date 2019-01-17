import * as R from 'rambda';
import * as ts from '@terascope/utils';

export function normalizeError(err: any): ts.TSError {
    let message: string = '';
    let statusCode: number = 500;
    let retryable = false;

    if (err && ts.isFunction(err.toJSON)) {
        const errObj = err.toJSON() as object;
        message = getErrorMessage(errObj);
        statusCode = getStatusCode(errObj);
    }

    if (!message) {
        message = ts.parseError(err);
    }
    if (!statusCode) {
        statusCode = getStatusCode(err);
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

export function throwValidationError(errors: ErrorLike[]|null|undefined): string|null {
    if (errors == null) return null;
    if (!errors.length) return null;

    const errorMsg = getErrorMessages(errors);

    const error = new ts.TSError(errorMsg, {
        statusCode: 422
    });

    Error.captureStackTrace(error, throwValidationError);
    throw error;
}

export const getErrorMessage: (error: ErrorLike) => string = R.pipe(
    R.ifElse(
        R.is(String),
        R.identity,
        R.ifElse(
            R.has('message'),
            R.path('message'),
            R.path('msg'),
        )
    ),
    R.defaultTo('Unknown Error'),
);

export const getErrorMessages: (errors: ErrorLike[]) => string = R.pipe(
    // @ts-ignore
    R.map(getErrorMessage),
    R.join(', '),
);

export const getErrorType = R.pathOr('', ['error', 'type']);

export const getStatusCode: (error: ErrorLike) => number = R.pipe(
    R.ifElse(
        R.has('statusCode'),
        R.path('statusCode'),
        R.path('status')
    ),
    R.defaultTo(500)
);

export type ErrorLike = {
    message?: string;
    msg?: string;
    statusCode?: number;
    status?: number;
}|string;

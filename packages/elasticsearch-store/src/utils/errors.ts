import * as R from 'rambda';
import * as ts from '@terascope/utils';
import ajv = require('ajv');

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

export function getErrorMessage(err: ErrorLike): string {
    const defaultErrorMsg = 'Unknown Error';
    if (err && ts.isString(err))  {
        return err;
    }

    const message: string = R.path('message', err) || R.pathOr(defaultErrorMsg, 'msg', err);
    const prefix = R.path('dataPath', err);

    return `${prefix ? `${prefix} ` : ''}${message}`;
}

export const getErrorMessages: (errors: ErrorLike[]) => string = R.pipe(
    // @ts-ignore
    R.map(getErrorMessage),
    R.join(', '),
);

export const getErrorType = R.pathOr('', 'error.type');

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
}|ajv.ErrorObject|string;

import * as R from 'rambda';
import * as ts from '@terascope/utils';

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
}|string;

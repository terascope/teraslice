import { TSError, isString, get } from '@terascope/core-utils';
import { ErrorObject } from 'ajv';

export function getErrorMessages(errors: ErrorLike[]): string {
    return errors.filter(Boolean).map(getErrorMessage)
        .join(',');
}

export function throwValidationError(errors: ErrorLike[] | null | undefined): string | null {
    if (errors == null) return null;
    if (!errors.length) return null;

    const errorMsg = getErrorMessages(errors);

    const error = new TSError(errorMsg, {
        statusCode: 400,
    });

    Error.captureStackTrace(error, throwValidationError);
    throw error;
}

export function getErrorMessage(err: ErrorLike): string {
    const defaultErrorMsg = 'Unknown Error';
    if (err && isString(err)) {
        return err;
    }

    const message: string = get(err, ['message']) || get(err, ['msg'], defaultErrorMsg);
    const prefix = get(err, ['dataPath']);

    return `${prefix ? `${prefix} ` : ''}${message}`;
}

export function getErrorType(err: unknown): string {
    return get(err, ['error', 'type'], '');
}

export type ErrorLike
    = | {
        message?: string;
        msg?: string;
        statusCode?: number;
        status?: number;
    }
    | ErrorObject
    | string;

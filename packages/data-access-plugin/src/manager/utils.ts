import * as apollo from 'apollo-server-express';
import { parseErrorInfo } from '@terascope/utils';

export function formatError(err: any) {
    if (err && err.extensions != null) return err;

    const { statusCode, message, code } = parseErrorInfo(err);

    let error: any;

    if (statusCode >= 400 && statusCode < 500) {
        if (statusCode === 422) {
            error = new apollo.ValidationError(message);
        } else if (statusCode === 401) {
            error = new apollo.AuthenticationError(message);
        } else if (statusCode === 403) {
            error = new apollo.ForbiddenError(message);
        } else {
            error = new apollo.UserInputError(message);
        }

        if (err && err.stack) error.stack = err.stack;
    } else {
        error = apollo.toApolloError(err, code);
    }

    return error;
}

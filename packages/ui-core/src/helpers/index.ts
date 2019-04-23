import * as ts from '@terascope/utils';

export * from './interfaces';

export function getErrorInfo(err: any): { message: string, statusCode: number } {
    const networkError = ts.get(err, 'networkError.result.errors[0]');
    const graphqlError = ts.get(err, 'graphQLErrors[0].extensions.exception');
    if (!networkError && !ts.isTSError(graphqlError)) {
        const { message, statusCode } = ts.parseErrorInfo(graphqlError || err);
        return { message, statusCode };
    }
    const message = ts.get(networkError, 'message');
    const code = ts.get(networkError, 'extensions.code');
    if (code === 'UNAUTHENTICATED') {
        return {
            statusCode: 401,
            message,
        };
    }

    for (const [statusCode, errorCode] of Object.entries(ts.STATUS_ERROR_CODES)) {
        if (code === errorCode) {
            return {
                statusCode: ts.toNumber(statusCode),
                message,
            };
        }
    }
    return {
        message,
        statusCode: ts.get(err, 'networkError.result.statusCode', 500)
    };
}

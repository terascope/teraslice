import * as ts from '@terascope/utils';

export function getErrorInfo(err: any): { message: string, statusCode: number } {
    // apollo likes to hide the original error
    const hiddenErr = ts.get(err, 'networkError.result.errors[0]');
    if (!hiddenErr) {
        const { message, statusCode } = ts.parseErrorInfo(err);
        return { message, statusCode };
    }
    const message = ts.get(hiddenErr, 'message');
    const code = ts.get(hiddenErr, 'extensions.code');
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

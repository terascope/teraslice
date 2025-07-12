import { Logger } from '@terascope/utils';

export function logWrapper(logger: Logger) {
    return function _logger(): Logger {
        return {
            error: logger.error.bind(logger),
            warning: logger.warn.bind(logger),
            info: logger.info.bind(logger),
            debug: logger.debug.bind(logger),
            trace(
                method: any,
                requestUrl: any,
                body: any,
                responseBody: any,
                responseStatus: any
            ) {
                logger.trace({
                    method,
                    requestUrl,
                    body,
                    responseBody,
                    responseStatus
                });
            },
            close() {}
        } as unknown as Logger;
    };
}

import get from 'lodash.get';
import { Client } from 'elasticsearch';
import { Request, Response } from 'express';
import { Context } from '@terascope/job-components';
import { parseErrorInfo, Logger, stripErrorMessage } from '@terascope/utils';

export function getFromReq(req: Request, prop: string, defaultVal?: any): any {
    return get(req, ['query', prop], get(req, ['body', prop], defaultVal));
}

export function getFromQuery(req: Request, prop: string, defaultVal?: any): any {
    return get(req, ['query', prop], defaultVal);
}

export type ErrorHandlerFn = (req: Request, res: Response, fn: (...args: any[]) => Promise<any>|any) => Promise<void>;

export function makeErrorHandler(reason: string, logger: Logger): ErrorHandlerFn {
    return async (req, res, fn) => {
        try {
            await fn();
        } catch (error) {
            const { statusCode, message } = parseErrorInfo(error, {
                defaultErrorMsg: reason
            });

            logger.error(error, reason, {
                path: req.path,
                query: req.query
            });

            res.status(statusCode).json({
                error: stripErrorMessage(message, reason)
            });
        }
    };
}

export function getESClient(context: Context, connection: string): Client {
    return context.foundation.getConnection({
        type: 'elasticsearch',
        endpoint: connection,
        cached: true
    }).client;
}

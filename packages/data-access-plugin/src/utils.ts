import get from 'lodash.get';
import { parseErrorInfo, Logger, stripErrorMessage } from '@terascope/utils';
import { Request, Response } from 'express';

export function getFromReq(req: Request, prop: string, defaultVal?: any): any {
    return get(req, ['query', prop], get(req, ['body', prop], defaultVal));
}

export function getFromQuery(req: Request, prop: string, defaultVal?: any): any {
    return get(req, ['query', prop], defaultVal);
}

export type errorHandlerFn = (req: Request, res: Response, fn: (...args: any[]) => Promise<any>|any) => Promise<void>;

export function makeErrorHandler(reason: string, logger: Logger): errorHandlerFn {
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

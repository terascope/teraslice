import get from 'lodash.get';
import { TSError, Logger } from '@terascope/utils';
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
        } catch (_err) {
            const err = new TSError(_err,  {
                reason,
                context: req.query
            });

            logger.error(err);
            res.status(err.statusCode).json({
                error: err.message.replace(/[A-Z]{2}Error/g, 'Error')
            });
        }
    };
}

import { Client } from 'elasticsearch';
import { Request, Response } from 'express';
import { Context } from '@terascope/job-components';
import * as ts from '@terascope/utils';

export type ErrorHandlerFn = (req: Request, res: Response, fn: (...args: any[]) => Promise<any> | any) => Promise<void>;

export function makeErrorHandler(reason: string, logger: ts.Logger): ErrorHandlerFn {
    return async (req, res, fn) => {
        try {
            await fn();
        } catch (error) {
            const { statusCode, context } = ts.parseErrorInfo(error);

            const realError = context.realError || error;
            logger.error(realError, reason, {
                path: req.originalUrl,
                query: req.query,
            });

            const resp: any = {
                error: ts.stripErrorMessage(error, reason, true),
            };

            const user = ts.get(req, 'v2User', { type: 'USER' });
            if (user.type === 'SUPERADMIN') {
                resp.debug = {
                    timestamp: ts.makeISODate(),
                };

                if (ts.isString(realError)) {
                    resp.debug.message = realError;
                } else {
                    resp.debug.message = realError.message;
                    resp.debug.stack = realError.stack;
                    resp.debug.statusCode = ts.getErrorStatusCode(realError);
                }
            }

            res.status(statusCode).json(resp);
        }
    };
}

export function getESClient(context: Context, connection: string): Client {
    return context.foundation.getConnection({
        type: 'elasticsearch',
        endpoint: connection,
        cached: true,
    }).client;
}

import { Client } from 'elasticsearch';
import { Request, Response } from 'express';
import { Context } from '@terascope/job-components';
import * as ts from '@terascope/utils';

export type ErrorHandlerFn = (req: Request, res: Response, fn: (...args: any[]) => Promise<any>|any) => Promise<void>;

export function makeErrorHandler(reason: string, logger: ts.Logger, requireSafe = false): ErrorHandlerFn {
    return async (req, res, fn) => {
        try {
            await fn();
        } catch (error) {
            const statusCode = ts.getErrorStatusCode(error);

            logger.error(error, reason, {
                path: req.originalUrl,
                query: req.query
            });

            const resp: any = {
                error: ts.stripErrorMessage(error, reason, requireSafe)
            };

            const user = ts.get(req, 'v2User', { type: 'USER' });
            if (user.type !== 'USER') {
                resp.debug = {
                    timestamp: ts.makeISODate()
                };

                if (ts.isString(error)) {
                    resp.debug.message = error;
                } else {
                    resp.debug.message = error.message;
                    resp.debug.stack = error.stack;
                    resp.debug.statusCode = statusCode;
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
        cached: true
    }).client;
}

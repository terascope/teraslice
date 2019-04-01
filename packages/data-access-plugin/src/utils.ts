import get from 'lodash.get';
import { Client } from 'elasticsearch';
import { Request, Response } from 'express';
import { Context } from '@terascope/job-components';
import { getErrorStatusCode, Logger, stripErrorMessage, makeISODate } from '@terascope/utils';

export type ErrorHandlerFn = (req: Request, res: Response, fn: (...args: any[]) => Promise<any>|any) => Promise<void>;

export function makeErrorHandler(reason: string, logger: Logger, requireSafe = false): ErrorHandlerFn {
    return async (req, res, fn) => {
        try {
            await fn();
        } catch (error) {
            const statusCode = getErrorStatusCode(error);

            logger.error(error, reason, {
                path: req.originalUrl,
                query: req.query
            });

            const resp: any = {
                error: stripErrorMessage(error, reason, requireSafe)
            };

            const user = get(req, 'v2User', { type: 'USER' });
            if (user.type !== 'USER') {
                resp.debug = {
                    timestamp: makeISODate()
                };

                if (error.message) {
                    resp.debug.message = error.message;
                }
                if (error.stack) {
                    resp.debug.stack = error.stack;
                }
                if (error.code) {
                    resp.debug.code = error.code;
                }
                if (error.statusCode) {
                    resp.debug.statusCode = error.statusCode;
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

import Table from 'easy-table';
import {
    parseErrorInfo, parseList, logError,
    isString, get, toInteger, Logger,
    TSError
} from '@terascope/core-utils';
import { TerasliceRequest, TerasliceResponse } from '../../interfaces.js';

export function makeTable(
    req: TerasliceRequest,
    defaults: string[],
    data: Record<string, any>[],
    mappingFn?: (item: any) => any
) {
    const query = fieldsQuery(req.query, defaults);
    let emptyChar = 'N/A';

    // used to create an empty table if there are no jobs
    if (data.length === 0) {
        emptyChar = '';
        data.push({});
    }

    return Table.print(data, (item, cell) => {
        const fn = mappingFn ? mappingFn(item) : (field: string) => get(item, field, emptyChar);
        query.forEach((field) => {
            cell(field, fn(field));
        });
    }, (table) => {
        if (('headers' in req.query) && req.query.headers === 'false') {
            return table.print();
        }
        return table.toString();
    });
}

function fieldsQuery(query: any, defaults: string[]): string[] {
    if (!query.fields) {
        return defaults || [];
    }

    const results = parseList(query.fields);

    if (results.length === 0) {
        return defaults;
    }

    return results;
}

export function handleTerasliceRequest(
    req: TerasliceRequest,
    res: TerasliceResponse,
    defaultErrorMsg = 'Failure to process TerasliceRequest',
    { errorCode = 500, successCode = 200 } = {}
) {
    logTerasliceRequest(req);
    return async (fn: () => Promise<string | Record<string, any>>) => {
        try {
            const result = await fn();

            if (isString(result)) {
                res.status(successCode).send(result);
            } else {
                res.status(successCode).json(result);
            }
        } catch (err) {
            const { statusCode, message } = parseErrorInfo(err, {
                defaultErrorMsg,
                defaultStatusCode: errorCode,
            });

            if (statusCode >= 500) {
                logError(req.logger, err);
            } else {
                logError(req.logger, message);
            }

            sendError(res, statusCode, message, req.logger);
        }
    };
}

export function sendError(
    res: TerasliceResponse,
    code: number,
    message: string,
    logger?: Logger
) {
    if (res.headersSent) {
        const error = new TSError(message);
        error.statusCode = code;
        if (logger) {
            logger.error(error, 'TerasliceRequest send error after headers sent');
        } else {
            console.error(error, 'TerasliceRequest send error after headers sent');
        }
        return;
    }
    res.status(code).json({
        error: code,
        message
    });
}

function parseQueryInt(req: TerasliceRequest, key: string, defaultVal: number): number {
    const val = req.query[key];
    if (val == null || val === '') return defaultVal;
    const parsed = toInteger(val);
    // allow the invalid prop to be passed through
    // (because an error should thrown downstream)
    if (parsed === false) {
        return req.query[key] as unknown as number;
    }
    return parsed;
}

export function getSearchOptions(req: TerasliceRequest, defaultSort = '_updated:desc') {
    const sort = req.query.sort || defaultSort;
    const size = parseQueryInt(req, 'size', 100);
    const from = parseQueryInt(req, 'from', 0);
    const filter = req.query.filter || '';
    return { size, from, sort, filter };
}

export function logTerasliceRequest(req: TerasliceRequest) {
    const queryInfo = Object.entries(req.query)
        .map(([key, val]) => `${key}: ${val}`)
        .join(', ');
    const { method, path } = req;
    req.logger.trace(`${method.toUpperCase()} ${path} endpoint has been called, ${queryInfo}`);
}

export function createJobActiveQuery(active: string) {
    if (active === 'true') {
        return 'job_id:* AND !active:false';
    }
    if (active === 'false') {
        return 'job_id:* AND active:false';
    }
    return 'job_id:*';
}

export function addDeletedToQuery(deleted: string, query: string) {
    if (deleted === 'false') {
        return `${query} AND (_deleted:false OR (* AND -_deleted:*))`;
    }
    return `${query} AND _deleted:true`;
}

/**
 * Combines a base query from an endpoint with an optional filter using AND from lucene.
 * @param query - The base Lucene query string
 * @param filter - Optional filter query to append. getSearchOptions() will return an empty string
 * if no filter is present.
 * @returns The combined query, or original query if filter is empty
 */
export function addFilterToQuery(query: string, filter: string): string {
    return filter ? `(${query}) AND (${filter})` : query;
}

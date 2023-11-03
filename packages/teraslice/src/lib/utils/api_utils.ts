import Table from 'easy-table';
import {
    parseErrorInfo, parseList, logError,
    isString, get, toInteger, Logger,
} from '@terascope/utils';
import { TerasliceRequest, TerasliceResponse } from '../../interfaces';

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
        const error = new Error(message);
        // @ts-expect-error  TODO: fixme
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

// NOTE: This only works for counters, if you're trying to extend this, you
// should probably switch to using prom-client.
export function makePrometheus(stats: any, defaultLabels = {}) {
    const metricMapping = {
        processed: 'teraslice_slices_processed',
        failed: 'teraslice_slices_failed',
        queued: 'teraslice_slices_queued',
        job_duration: '', // this isn't really useful, omitting
        workers_joined: 'teraslice_workers_joined',
        workers_disconnected: 'teraslice_workers_disconnected',
        workers_reconnected: 'teraslice_workers_reconnected'
    };

    let returnString = '';
    Object.entries(stats.controllers).forEach(([key, value]) => {
        const name = metricMapping[key];
        if (name !== '') {
            returnString += `# TYPE ${name} counter\n`;
            const labels = makePrometheusLabels(defaultLabels);
            returnString += `${name}${labels} ${value}\n`;
        }
    });
    return returnString;
}

function makePrometheusLabels(defaults = {}) {
    const labels = Object.assign({}, defaults);
    const keys = Object.keys(labels);
    if (!keys.length) return '';

    const labelsStr = keys.map((key) => {
        const val = labels[key];
        return `${key}="${val}"`;
    }).join(',');

    return `{${labelsStr}}`;
}

export function isPrometheusTerasliceRequest(req: TerasliceRequest) {
    const acceptHeader = get(req, 'headers.accept', '');
    return acceptHeader && acceptHeader.indexOf('application/openmetrics-text;') > -1;
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
    return { size, from, sort };
}

export function logTerasliceRequest(req: TerasliceRequest) {
    const queryInfo = Object.entries(req.query)
        .map(([key, val]) => `${key}: ${val}`)
        .join(', ');
    const { method, path } = req;
    req.logger.trace(`${method.toUpperCase()} ${path} endpoint has been called, ${queryInfo}`);
}

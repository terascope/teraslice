import Table from 'easy-table';
import {
    parseErrorInfo, parseList, logError,
    isString, get, toInteger,
} from '@terascope/utils';

export function makeTable(req, defaults, data, mappingFn) {
    const query = fieldsQuery(req.query, defaults);
    let emptyChar = 'N/A';

    // used to create an empty table if there are no jobs
    if (data.length === 0) {
        emptyChar = '';
        data.push({});
    }

    return Table.print(data, (item, cell) => {
        const fn = mappingFn ? mappingFn(item) : (field) => get(item, field, emptyChar);
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

function fieldsQuery(query, defaults) {
    if (!query.fields) {
        return defaults || [];
    }

    const results = parseList(query.fields);

    if (results.length === 0) {
        return defaults;
    }

    return results;
}

export function handleRequest(req, res, defaultErrorMsg = 'Failure to process request', { errorCode = 500, successCode = 200 } = {}) {
    logRequest(req);
    return async (fn) => {
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

export function sendError(res, code, message, logger) {
    if (res.headersSent) {
        const error = new Error(message);
        error.statusCode = code;
        if (logger) {
            logger.error(error, 'request send error after headers sent');
        } else {
            console.error(error, 'request send error after headers sent');
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
export function makePrometheus(stats, defaultLabels = {}) {
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

function makePrometheusLabels(defaults, custom) {
    const labels = Object.assign({}, defaults, custom);
    const keys = Object.keys(labels);
    if (!keys.length) return '';

    const labelsStr = keys.map((key) => {
        const val = labels[key];
        return `${key}="${val}"`;
    }).join(',');

    return `{${labelsStr}}`;
}

export function isPrometheusRequest(req) {
    const acceptHeader = get(req, 'headers.accept', '');
    return acceptHeader && acceptHeader.indexOf('application/openmetrics-text;') > -1;
}

/**
 * @returns {number}
*/
function parseQueryInt(req, prop, defaultVal) {
    const val = req.query[prop];
    if (val == null || val === '') return defaultVal;
    const parsed = toInteger(val);
    // allow the invalid prop to be passed through
    // (because an error should thrown downstream)
    if (parsed === false) return req.query[prop];
    return parsed;
}

export function getSearchOptions(req, defaultSort = '_updated:desc') {
    const sort = req.query.sort || defaultSort;
    const size = parseQueryInt(req, 'size', 100);
    const from = parseQueryInt(req, 'from', 0);
    return { size, from, sort };
}

export function logRequest(req) {
    const queryInfo = Object.entries(req.query)
        .map(([key, val]) => `${key}: ${val}`)
        .join(', ');
    const { method, path } = req;
    req.logger.trace(`${method.toUpperCase()} ${path} endpoint has been called, ${queryInfo}`);
}

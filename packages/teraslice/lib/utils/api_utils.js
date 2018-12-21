'use strict';

const _ = require('lodash');
const { STATUS_CODES } = require('http');
const Table = require('easy-table');
const parseError = require('@terascope/error-parser');

function makeTable(req, defaults, data, mappingFn) {
    const query = fieldsQuery(req.query, defaults);
    let emptyChar = 'N/A';

    // used to create an empty table if there are no jobs
    if (data.length === 0) {
        emptyChar = '';
        data.push({});
    }

    return Table.print(data, (item, cell) => {
        const fn = mappingFn ? mappingFn(item) : field => _.get(item, field, emptyChar);
        _.each(query, (field) => {
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

    const results = query.fields.split(',').map(word => word.trim());

    if (results.length === 0) {
        return defaults;
    }

    return results;
}

function handleRequest(req, res, defaultErrorMsg = 'Failure to process request', { errorCode = 500, successCode = 200 } = {}) {
    logRequest(req);
    return async (fn) => {
        try {
            const result = await fn();
            if (_.isString(result)) {
                res.status(successCode).send(result);
            } else {
                res.status(successCode).json(result);
            }
        } catch (err) {
            const { code, message } = getErrorMsgAndCode(err, errorCode, defaultErrorMsg);
            req.logger.error(message);
            sendError(res, code, message);
        }
    };
}

function getErrorMsgAndCode(err, defaultCode = 500, defaultMsg) {
    let message = defaultMsg || STATUS_CODES[defaultCode];
    let code = defaultCode;

    if (_.isError(err) || err.statusCode || err.code) {
        code = err.statusCode || err.code || defaultCode;
        ({ message } = err);
    } else {
        message = parseError(err);
    }

    if (STATUS_CODES[code] != null) {
        return {
            code,
            message,
        };
    }

    return { code, message };
}

function sendError(res, code, message) {
    res.status(code).json({
        error: code,
        message
    });
}

// NOTE: This only works for counters, if you're trying to extend this, you
// should probably switch to using prom-client.
function makePrometheus(stats, defaultLabels = {}) {
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
    _.forEach(stats.controllers, (value, key) => {
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

function isPrometheusRequest(req) {
    const acceptHeader = _.get(req, 'headers.accept', '');
    return acceptHeader && acceptHeader.indexOf('application/openmetrics-text;') > -1;
}

function getSearchOptions(req, defaultSort = '_updated:desc') {
    const { size = 100, from = null, sort = defaultSort } = req.query;
    return { size, from, sort };
}

function logRequest(req) {
    const queryInfo = _.map(req.query, (val, key) => `${key}: ${val}`).join(', ');
    const { method, path } = req;
    req.logger.trace(`${_.toUpper(method)} ${path} endpoint has been called, ${queryInfo}`);
}

module.exports = {
    isPrometheusRequest,
    makePrometheus,
    makeTable,
    logRequest,
    getSearchOptions,
    getErrorMsgAndCode,
    handleRequest,
    sendError
};

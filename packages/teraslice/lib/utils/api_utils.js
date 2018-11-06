'use strict';

const _ = require('lodash');
const Table = require('easy-table');
const parseError = require('@terascope/error-parser');


function makeTable(req, defaults, data, mappingFn) {
    const query = fieldsQuery(req.query, defaults);
    // used to create an empty table if there are no jobs
    if (data.length === 0) {
        data.push({});
    }

    return Table.print(data, (item, cell) => {
        const fn = mappingFn ? mappingFn(item) : field => item[field];
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

function handleError(res, logger, defualtCode, defaultErrorMsg) {
    return (errObj) => {
        if (errObj.code) {
            logger.error(errObj.message);
            sendError(res, errObj.code, errObj.message);
            return;
        }
        const errMsg = `${defaultErrorMsg}, error: ${parseError(errObj)}`;
        logger.error(errMsg);
        sendError(res, defualtCode, errMsg);
    };
}

function sendError(res, code, error) {
    res.status(code).json({
        error: code,
        message: error
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


module.exports = {
    isPrometheusRequest,
    makePrometheus,
    makeTable,
    handleError,
    sendError
};

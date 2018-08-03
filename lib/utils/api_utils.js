'use strict';

const _ = require('lodash');
const Table = require('easy-table');
const VError = require('verror');
const parseError = require('@terascope/error-parser');
const { logError, getErrorStatusCode } = require('./error_utils');

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

// A simple version of handleError that works with VError
// The goal is to log the full stack and send back the error.message and error info
function respondWithError(res, logger, err) {
    const code = getErrorStatusCode(err, 3);
    logError(logger, err);
    res.status(code).json({
        error: code,
        message: err.toString(),
        info: VError.info(err)
    });
}

module.exports = {
    makeTable,
    handleError,
    respondWithError,
    sendError
};

'use strict';

const _ = require('lodash');
const parseError = require('@terascope/error-parser');

function retryModule(logger, numOfRetries) {
    const retry = {};
    return function _retryModule(key, err, fn, msg) {
        const errMessage = parseError(err);
        logger.error('error while getting next slice', errMessage);

        if (!retry[key]) {
            retry[key] = 1;
            return fn(msg);
        }

        retry[key] += 1;
        if (retry[key] > numOfRetries) {
            return Promise.reject(`max_retries met for slice, key: ${key}`, errMessage);
        }

        return fn(msg);
    };
}

function prependErrorMsg(msg, err, withStack = false) {
    const errorMsg = `${msg}, caused by `;
    if (!withStack && !_.isString(err)) {
        delete err.stack;
    }
    return errorMsg + parseError(err);
}

module.exports = {
    prependErrorMsg,
    retryModule
};

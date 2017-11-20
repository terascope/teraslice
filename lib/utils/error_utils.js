'use strict';

const parseError = require('error_parser');

function retryModule(logger, numOfRetries) {
    const retry = {};
    return function (key, err, fn, msg) {
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

module.exports = {
    retryModule
};

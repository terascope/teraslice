'use strict';


function parseError(err) {
    if (err.toJSON) {
        var err = err.toJSON();
        if (err.msg) {
            return err.msg;
        }
        else {
            return "Unknown ES Error Format " + JSON.stringify(err);
        }
    }
    if (err.stack) {
        return err.stack
    }
    return err.response ? err.response : err;
}

function retryModule(logger, numOfRetries) {
    let retry = {};
    return function(key, err, fn, msg) {
        var errMessage = parseError(err);
        logger.error('error while getting next slice', errMessage);

        if (!retry[key]) {
            retry[key] = 1;
            return fn(msg)
        }
        else {
            retry[key] += 1;
            if (retry[key] > numOfRetries) {
                return Promise.reject(`max_retries met for slice, key: ${key}`, errMessage);
            }
            else {
                return fn(msg)
            }
        }
    }
}

module.exports = {
    parseError: parseError,
    retryModule: retryModule
};
'use strict';

const _ = require('lodash');
const parseError = require('@terascope/error-parser');
const { STATUS_CODES } = require('http');
const {
    VError,
    WError,
    SError,
    MultiError
} = require('verror');

function retryModule(logger, numOfRetries) {
    const retry = {};
    return function _retryModule(key, err, fn, msg) {
        const error = new VError(err, 'failure while getting the next slice');
        logError(logger, error);

        if (!retry[key]) {
            retry[key] = 1;
            return fn(msg);
        }

        retry[key] += 1;
        if (retry[key] > numOfRetries) {
            return Promise.reject(new VError(err, 'max_retries met for slice, key: %s', key));
        }

        return fn(msg);
    };
}

function _validLogger(logger) {
    if (logger == null) return false;
    if (!_.isFunction(logger.error)) return false;
    if (!_.isFunction(logger.warn)) return false;
    return true;
}

function _validError(error) {
    if (_.isError(error)) return true;
    if (error instanceof VError) return true;
    if (error instanceof WError) return true;
    if (error instanceof SError) return true;
    if (error instanceof MultiError) return true;
    return false;
}

// By default logger will use logger.error,
// otherwise if it is "user error" it will use logger.warn
// and it only print the basics
function logError(logger, error) {
    if (!_validLogger(logger)) {
        // eslint-disable-next-line no-console
        console.error(new Error('Expected logError to be called with a valid logger'));
        return;
    }

    if (!_validError(error)) {
        logger.error(_.isString(error) ? error : parseError(error));
        return;
    }

    const rest = [];
    const info = VError.info(error);

    if (!_.isEmpty(info)) {
        rest.push(info);
    }

    if (isUserError(error)) {
        logger.warn(formatError(error), ...rest);
    } else {
        logger.error(formatError(error), ...rest);
    }
}

function isUserError(error) {
    const code = getErrorStatusCode(error, 0);
    return code < 500 || error instanceof WError;
}

// Similar to VError.fullStack(error) but I think it is easier to read
function formatError(error, append, wasUserError) {
    const sep = wasUserError ? ' ' : '\n ';
    let errorMsg = append ? `${sep}caused by: ` : '';

    const userError = isUserError(error);
    if (userError) {
        if (wasUserError) {
            errorMsg += `${error.message}`;
        } else {
            errorMsg += `UserError: ${error.message}`;
        }
    } else {
        errorMsg += error.stack;
    }
    const nextError = VError.cause(error);

    // append any additional errors to the string
    // unless this error is a UserError
    // (this makes it easier to read chained user errors)
    if (_validError(nextError)) {
        errorMsg += formatError(nextError, true, userError);
    }

    return errorMsg
        .replace('WError', 'UserError')
        .replace(/[VS]Error/g, 'Error');
}

// Find any status code's on the error any from the cause tree
function getErrorStatusCode(err = {}, depth = 2) {
    const code = err.statusCode || err.code;
    if (STATUS_CODES[code]) return code;

    if (err.userError) return 400;

    const cause = VError.cause(err);
    if (depth > 0 && cause) {
        return getErrorStatusCode(cause, depth - 1);
    }

    return 500;
}

module.exports = {
    retryModule,
    formatError,
    getErrorStatusCode,
    isUserError,
    logError,
};

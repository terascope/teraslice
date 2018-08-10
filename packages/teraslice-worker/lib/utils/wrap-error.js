'use strict';

const util = require('util');
const _ = require('lodash');
const NestedError = require('nested-error-stacks');
const parseError = require('@terascope/error-parser');

function WrapError(...args) {
    let message = _.nth(args, 0);
    let error = _.nth(args, 1);

    if (!error) {
        error = message;
    }

    if (!_.isError(error)) {
        error = new Error(_.get(error, 'message', error || 'Unknown Exception'));
        Error.captureStackTrace(error, Error);
    }

    if (!message) {
        message = error.toString();
    } else {
        message = `${message}, ${error.toString()}`;
    }

    NestedError.call(this, message, error);
}

util.inherits(WrapError, NestedError);

WrapError.prototype.name = 'Error';

WrapError.prototype.toString = function _toString() {
    const parsedErr = parseError(this);
    let errors = [];

    _.forEach(_.split(parsedErr, 'Error: '), (part) => {
        if (!part) return;
        let trimmed = _.trim(part);
        trimmed = _.trimEnd(trimmed, ':,');
        const err = `Error: ${trimmed}`;
        if (!_.includes(errors, err)) {
            errors.push(err);
        }
    });

    errors = _.uniq(errors);

    const [err1, err2] = errors;
    if (err1 && err2 && _.startsWith(err2, err1)) {
        return err2;
    }

    return _.join(errors, ', caused by ');
};

module.exports = WrapError;

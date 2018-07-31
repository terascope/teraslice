'use strict';

const os = require('os');
const _ = require('lodash');
const url = require('url');

function formatURL(hostname = os.hostname(), port) {
    let formatOptions;
    try {
        const parsed = new url.URL(hostname);
        formatOptions = _.assign(parsed, {
            port,
        });
    } catch (err) {
        formatOptions = {
            protocol: 'http:',
            slashes: true,
            hostname,
            port,
        };
    }

    return url.format(formatOptions);
}

function getWorkerId(arg) {
    let workerId;
    if (_.isString(arg)) {
        workerId = arg;
    }
    if (!workerId) {
        workerId = _.get(arg, 'worker_id', _.get(arg, 'workerId'));
    }
    if (!workerId) {
        workerId = _.get(arg, 'payload.worker_id', _.get(arg, 'payload.workerId'));
    }
    return workerId;
}

module.exports = {
    getWorkerId,
    formatURL,
};

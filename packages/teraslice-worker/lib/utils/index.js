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

function waitForWorkerShutdown(context, eventName) {
    const shutdownTimeout = _.get(context, 'sysconfig.teraslice.shutdown_timeout', 30000);
    const events = context.apis.foundation.getSystemEvents();
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            events.removeListener(eventName, handler);
            reject(new Error('Timeout waiting for worker to shutdown'));
        }, shutdownTimeout);
        function handler(err) {
            clearTimeout(timeoutId);
            if (_.isError(err)) {
                reject(err);
            } else {
                resolve();
            }
        }
        events.once(eventName, handler);
    });
}

module.exports = {
    waitForWorkerShutdown,
    getWorkerId,
    formatURL,
};

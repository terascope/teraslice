'use strict';

const _ = require('lodash');
const Promise = require('bluebird');

function makeShutdownEarlyFn({ exController, enabled = false }) {
    let resolve;
    let shutdownErr = {
        message: 'Shutdown never triggered'
    };
    let alreadyCalled = false;

    const deferred = new Promise((_resolve) => {
        resolve = _resolve;
    });

    const catchShutdown = async () => {
        if (alreadyCalled) return;
        alreadyCalled = true;

        shutdownErr.message = 'Shutdown trigger but did not error';
        try {
            await exController.shutdown();
        } catch (err) {
            shutdownErr = err;
        }
        resolve();
    };

    return {
        error: () => shutdownErr,
        wait: async () => {
            if (!enabled) return;
            await deferred;
        },
        shutdown: async () => {
            if (!enabled) return;

            await Promise.delay(100);

            catchShutdown();

            await Promise.delay(100);
        }
    };
}

function getTestCases(testCases) {
    const onlyCases = _.filter(testCases, ts => ts[1].only);
    if (onlyCases.length > 0) {
        // eslint-disable-next-line no-console
        console.warn('[WARNING]: test cases includes a "only" property, make sure to remove this before committing');
        return onlyCases;
    }

    const cases = _.reject(testCases, ts => ts[1].skip);
    if (cases.length !== testCases.length) {
        // eslint-disable-next-line no-console
        console.warn('[WARNING]: test cases includes a "skip" property, make sure to remove this before committing');
    }
    return cases;
}

module.exports = { makeShutdownEarlyFn, getTestCases };

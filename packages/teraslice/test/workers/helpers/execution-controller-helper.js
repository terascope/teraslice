import _ from 'lodash';
import { pDelay, pDefer } from '@terascope/utils';

export function makeShutdownEarlyFn({ exController, enabled = false }) {
    let shutdownErr = {
        message: 'Shutdown never triggered'
    };
    let alreadyCalled = false;

    const deferred = pDefer();

    const catchShutdown = async () => {
        if (alreadyCalled) return;
        alreadyCalled = true;

        shutdownErr.message = 'Shutdown trigger but did not error';
        try {
            await exController.shutdown();
        } catch (err) {
            shutdownErr = err;
        }

        deferred.resolve();
    };

    return {
        error: () => shutdownErr,
        wait: async () => {
            if (!enabled) return;
            await deferred.promise;
        },
        shutdown: async () => {
            if (!enabled) return;

            await pDelay(100);

            catchShutdown();

            await pDelay(100);
        }
    };
}

export function getTestCases(testCases) {
    const onlyCases = _.filter(testCases, (ts) => ts[1].only);
    if (onlyCases.length > 0) {
        // eslint-disable-next-line no-console
        console.warn(
            '[WARNING]: test cases includes a "only" property, make sure to remove this before committing'
        );
        return onlyCases;
    }

    const cases = _.reject(testCases, (ts) => ts[1].skip);
    if (cases.length !== testCases.length) {
        // eslint-disable-next-line no-console
        console.warn(
            '[WARNING]: test cases includes a "skip" property, make sure to remove this before committing'
        );
    }
    return cases;
}

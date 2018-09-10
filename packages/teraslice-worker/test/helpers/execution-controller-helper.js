'use strict';

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

module.exports = { makeShutdownEarlyFn };

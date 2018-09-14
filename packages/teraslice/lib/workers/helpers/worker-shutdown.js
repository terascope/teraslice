'use strict';

const Promise = require('bluebird');
const _ = require('lodash');

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

/* istanbul ignore next */
function shutdownHandler(context, shutdownFn) {
    const assignment = context.assignment || process.env.NODE_TYPE || process.env.assignment || 'unknown-assignment';

    const isProcessRestart = process.env.process_restart;
    const restartOnFailure = assignment !== 'exectution_controller';
    const api = {
        exiting: false,
        exit
    };

    const shutdownTimeout = _.get(context, 'sysconfig.teraslice.shutdown_timeout', 20 * 1000);

    const events = context.apis.foundation.getSystemEvents();
    const logger = context.apis.foundation.makeLogger({ module: `${assignment}:shutdown_handler` });

    if (assignment === 'execution_controller' && isProcessRestart) {
        logger.fatal('Execution Controller runtime error led to a restart, terminating execution with failed status, please use the recover api to return slicer to a consistent state');
        process.exit(0);
    }

    function flushLogs() {
        return Promise.resolve()
            .then(() => this.logger.flush())
            .then(() => Promise.delay(1000));
    }

    function exit(event, err) {
        if (api.exiting) return;

        api.exiting = true;
        logger.warn(`${assignment} exiting in ${shutdownTimeout}ms...`);

        const startTime = Date.now();
        Promise.race([
            shutdownFn(event, err),
            Promise.delay(shutdownTimeout - 2000)
        ]).then(() => {
            logger.debug(`${assignment} shutdown took ${Date.now() - startTime}ms`);
        }).catch((error) => {
            logger.error(`${assignment} while shutting down`, error);
        }).then(() => {
            const code = process.exitCode || 0;
            logger.trace(`flushing log and exiting with code ${code}`);
            return flushLogs()
                .finally(() => {
                    process.exit();
                });
        });
    }

    process.once('SIGINT', () => {
        logger.warn('Received process:SIGINT');
        if (!api.exiting) {
            process.exitCode = 0;
        }
        exit('SIGINT');
    });

    process.once('SIGTERM', () => {
        logger.warn(`${assignment} received process:SIGTERM`);
        if (!api.exiting) {
            process.exitCode = 0;
        }
        exit('SIGTERM');
    });

    process.once('uncaughtException', (err) => {
        logger.fatal(`${assignment} received an uncaughtException`, err);
        if (!api.exiting) {
            process.exitCode = restartOnFailure ? 1 : 0;
        }
        exit('uncaughtException', err);
    });

    process.once('unhandledRejection', (err) => {
        logger.fatal(`${assignment} received an unhandledRejection`, err);
        if (!api.exiting) {
            process.exitCode = restartOnFailure ? 1 : 0;
        }
        exit('unhandledRejection', err);
    });

    // event is fired from terafoundation when an error occurs during instantiation of a client
    events.once('client:initialization:error', (err) => {
        logger.fatal(`${assignment} received a client initialization error`, err);
        if (!api.exiting) {
            process.exitCode = restartOnFailure ? 1 : 0;
        }
        exit('client:initialization:error', err);
    });

    events.once('worker:shutdown:complete', (err) => {
        if (!api.exiting) {
            process.exitCode = 0;
        }
        if (err) {
            logger.fatal(`${assignment} shutdown error`, err);
        } else {
            logger.warn(`${assignment} shutdown`);
        }
        exit('worker:shutdown:complete', err);
    });

    return api;
}

module.exports = {
    shutdownHandler,
    waitForWorkerShutdown,
};

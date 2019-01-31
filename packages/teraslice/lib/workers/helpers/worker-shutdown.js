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

    let startTime;

    function exitingIn() {
        if (!api.exiting) {
            return `exiting in ${shutdownTimeout}ms...`;
        }

        const elapsed = Date.now() - startTime;
        return `already shutting down, remaining ${shutdownTimeout - elapsed}ms`;
    }

    function exit(event, err) {
        if (api.exiting) return;

        api.exiting = true;
        startTime = Date.now();

        Promise.race([
            shutdownFn(event, err),
            Promise.delay(shutdownTimeout - 2000)
        ]).then(() => {
            logger.info(`${assignment} shutdown took ${Date.now() - startTime}ms`);
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

    process.on('SIGINT', () => {
        logger.info(`${assignment} received process:SIGINT, ${exitingIn()}`);
        if (!api.exiting) {
            process.exitCode = 0;
        }
        exit('SIGINT');
    });

    process.on('SIGTERM', () => {
        logger.info(`${assignment} received process:SIGTERM, ${exitingIn()}`);
        if (!api.exiting) {
            process.exitCode = 0;
        }
        exit('SIGTERM');
    });

    process.on('uncaughtException', (err) => {
        logger.fatal(err, `${assignment} received an uncaughtException, ${exitingIn()}`);
        if (!api.exiting) {
            process.exitCode = restartOnFailure ? 1 : 0;
        }
        exit('uncaughtException', err);
    });

    process.once('unhandledRejection', (err) => {
        logger.fatal(err, `${assignment} received an unhandledRejection, ${exitingIn()}`);
        if (!api.exiting) {
            process.exitCode = restartOnFailure ? 1 : 0;
        }
        exit('unhandledRejection', err);
    });

    // See https://github.com/trentm/node-bunyan/issues/246
    function handleStdError(err) {
        if (err.code === 'EPIPE' || err.code === 'ERR_STREAM_DESTROYED') {
        // ignore
        } else {
            throw err;
        }
    }

    process.stdout.on('error', handleStdError);
    process.stderr.on('error', handleStdError);

    // event is fired from terafoundation when an error occurs during instantiation of a client
    events.once('client:initialization:error', (err) => {
        logger.fatal(`${assignment} received a client initialization error, ${exitingIn()}`, err);
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
            logger.fatal(err, `${assignment} shutdown error, ${exitingIn()}`);
        } else {
            logger.info(`${assignment} shutdown, ${exitingIn()}`);
        }
        exit('worker:shutdown:complete', err);
    });

    return api;
}

module.exports = {
    shutdownHandler,
    waitForWorkerShutdown,
};

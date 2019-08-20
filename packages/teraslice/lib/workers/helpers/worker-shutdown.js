'use strict';

const {
    get, pDelay, pRaceWithTimeout, isError
} = require('@terascope/utils');
const ms = require('ms');
const { makeLogger } = require('./terafoundation');

function waitForWorkerShutdown(context, eventName) {
    const shutdownTimeout = get(context, 'sysconfig.teraslice.shutdown_timeout', 30000);
    const events = context.apis.foundation.getSystemEvents();

    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            events.removeListener(eventName, handler);
            reject(new Error('Timeout waiting for worker to shutdown'));
        }, shutdownTimeout);

        function handler(err) {
            clearTimeout(timeoutId);
            if (isError(err)) {
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
    const assignment = context.assignment
        || process.env.NODE_TYPE
        || process.env.assignment
        || 'unknown-assignment';

    const isK8s = get(context, 'sysconfig.teraslice.cluster_manager_type') === 'kubernetes';
    const isProcessRestart = process.env.process_restart;
    const allowNonZeroExitCode = isK8s || assignment !== 'exectution_controller';
    const api = {
        exiting: false,
        exit
    };

    const shutdownTimeout = get(context, 'sysconfig.teraslice.shutdown_timeout', 20 * 1000);

    const events = context.apis.foundation.getSystemEvents();
    const logger = makeLogger(context, `${assignment}:shutdown_handler`);

    if (assignment === 'execution_controller' && isProcessRestart) {
        logger.fatal(
            'Execution Controller runtime error led to a restart, terminating execution with failed status, please use the recover api to return slicer to a consistent state'
        );
        process.exit(0);
    }

    async function flushLogs() {
        try {
            await logger.flush();
            await pDelay(1000);

            const code = process.exitCode || 0;
            logger.debug(`flushed logs successfully, will exit with code ${code}`);
        } catch (err) {
            logger.error(err, 'flush error on shutdown');
        }
    }

    let startTime;

    function exitingIn() {
        if (!api.exiting) {
            return `exiting in ${ms(shutdownTimeout)}...`;
        }

        const elapsed = Date.now() - startTime;
        return `already shutting down, remaining ${ms(shutdownTimeout - elapsed)}`;
    }

    async function callShutdownFn(event, err) {
        await shutdownFn(event, err);
    }

    async function shutdownWithTimeout(event, err) {
        const logError = (_err) => {
            logger.error(_err, 'shutdown error after timeout');
        };
        const timeout = shutdownTimeout - 2000;
        await pRaceWithTimeout(callShutdownFn(event, err), timeout, logError);
    }

    async function exit(event, err) {
        if (api.exiting) return;

        api.exiting = true;
        startTime = Date.now();

        try {
            await shutdownWithTimeout(event, err);
            logger.info(`${assignment} shutdown took ${ms(Date.now() - startTime)}`);
        } catch (error) {
            logger.error(error, `${assignment} while shutting down`);
        } finally {
            await flushLogs();
            if (allowNonZeroExitCode) {
                process.exit();
            } else {
                process.exit(0);
            }
        }
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
        logger.error(err, `${assignment} received an uncaughtException, ${exitingIn()}`);
        if (!api.exiting) {
            process.exitCode = 1;
        }
        exit('uncaughtException', err);
    });

    process.once('unhandledRejection', (err) => {
        logger.error(err, `${assignment} received an unhandledRejection, ${exitingIn()}`);
        if (!api.exiting) {
            process.exitCode = 1;
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
        logger.error(err, `${assignment} received a client initialization error, ${exitingIn()}`);
        if (!api.exiting) {
            process.exitCode = 1;
        }
        exit('client:initialization:error', err);
    });

    events.once('worker:shutdown:complete', (err) => {
        if (!api.exiting) {
            process.exitCode = 0;
        }
        if (err) {
            logger.error(err, `${assignment} shutdown error, ${exitingIn()}`);
        } else {
            logger.info(`${assignment} shutdown, ${exitingIn()}`);
        }
        exit('worker:shutdown:complete', err);
    });

    return api;
}

module.exports = {
    shutdownHandler,
    waitForWorkerShutdown
};

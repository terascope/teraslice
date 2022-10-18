import {
    get, pDelay, pRaceWithTimeout,
    isError, logError
} from '@terascope/utils';
import ms from 'ms';
import { makeLogger } from './terafoundation.js';

export function waitForWorkerShutdown(context, eventName) {
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
export function shutdownHandler(context, shutdownFn) {
    const assignment = context.assignment
        || process.env.NODE_TYPE
        || process.env.assignment
        || 'unknown-assignment';

    const isK8s = get(context, 'sysconfig.teraslice.cluster_manager_type') === 'kubernetes';
    // this is native clustering only
    const isProcessRestart = process.env.process_restart;
    // everything but the k8s execution_controller should not be allowed be allowed to
    // set a non-zero exit code (to avoid being restarted)
    const allowNonZeroExitCode = !(isK8s && assignment === 'execution_controller');
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
            logError(logger, err, 'flush error on shutdown');
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
        // avoid failing before the promse is try / catched in pRaceWithTimeout
        await pDelay(100);
        await shutdownFn(event, err);
    }

    async function shutdownWithTimeout(event, err) {
        const timeout = shutdownTimeout - 2000;
        await pRaceWithTimeout(callShutdownFn(event, err), timeout, (timeoutErr) => {
            logError(logger, timeoutErr, 'shutdown error after timeout');
        });
    }

    async function exit(event, err) {
        if (api.exiting) return;

        api.exiting = true;
        startTime = Date.now();

        try {
            await shutdownWithTimeout(event, err);
        } catch (error) {
            logError(logger, error, `${assignment} while shutting down`);
        } finally {
            await flushLogs();
            if (allowNonZeroExitCode) {
                const code = process.exitCode != null ? process.exitCode : 0;
                logger.info(`${assignment} shutdown took ${ms(Date.now() - startTime)}, exit with ${code} status code`);
                process.exit();
            } else {
                logger.info(`${assignment} shutdown took ${ms(Date.now() - startTime)}, exit with zero status code`);
                process.exit(0);
            }
        }
    }

    function setStatusCode(code) {
        if (api.exiting) return;
        if (process.exitCode == null) {
            process.exitCode = code;
        }
    }

    process.on('SIGINT', () => {
        logger.info(`${assignment} received process:SIGINT, ${exitingIn()}`);
        setStatusCode(0);
        exit('SIGINT');
    });

    process.on('SIGTERM', () => {
        logger.info(`${assignment} received process:SIGTERM, ${exitingIn()}`);
        setStatusCode(0);
        exit('SIGTERM');
    });

    process.on('uncaughtException', (err) => {
        logError(logger, err, `${assignment} received an uncaughtException, ${exitingIn()}`);
        setStatusCode(1);
        exit('uncaughtException', err);
    });

    process.once('unhandledRejection', (err) => {
        logError(logger, err, `${assignment} received an unhandledRejection, ${exitingIn()}`);
        setStatusCode(1);
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
    // **DEPRECATED:** This handler should be removed on teraslice v1
    events.once('client:initialization:error', (err) => {
        logError(logger, err, `${assignment} received a client initialization error, ${exitingIn()}`);
        setStatusCode(1);
        exit('client:initialization:error', err);
    });

    events.once('worker:shutdown:complete', (err) => {
        setStatusCode(0);
        if (err) {
            logError(logger, err, `${assignment} shutdown error, ${exitingIn()}`);
        } else {
            logger.info(`${assignment} shutdown, ${exitingIn()}`);
        }
        exit('worker:shutdown:complete', err);
    });

    return api;
}

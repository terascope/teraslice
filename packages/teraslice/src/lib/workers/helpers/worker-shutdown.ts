import {
    pDelay, pRaceWithTimeout, isError,
    logError, msUntilUnixTime
} from '@terascope/core-utils';
import type { Context } from '@terascope/job-components';
import ms from 'ms';
import { makeLogger } from './terafoundation.js';

// time in milliseconds to wait after shutdown_timeout before
// killing stuck processes or performing cleanup tasks
export const POST_SHUTDOWN_BUFFER = 3000;
// time in milliseconds before shutdown_timeout that pRaceWithTimeout cuts off
const RACE_RESERVE = 2000;
// instance shutdown lands this far ahead of the race so its error wins
const INSTANCE_MARGIN = 500;
// the most time each instance reserves after its phase deadline for its
// final phase. The execution controller's final phase includes the analytics
// push to the cluster master and the server close delay, so it gets more.
const FINAL_PHASE_MAX = {
    worker: 10_000,
    execution_controller: 15_000,
} as const;

export interface ShutdownDeadlines {
    /** Unix timestamp at which pRaceWithTimeout stops waiting, flushes logs and exits */
    raceDeadline: number;
    /**
     * Unix timestamp the instance shutdown must finish by. It is ahead of
     * raceDeadline so the instance's own timeout errors are logged instead
     * of the generic race error.
    */
    instanceDeadline: number;
}

export function getShutdownDeadlines(
    startTime: number,
    shutdownTimeout: number
): ShutdownDeadlines {
    const raceDeadline = startTime + shutdownTimeout - RACE_RESERVE;
    const instanceDeadline = raceDeadline - INSTANCE_MARGIN;
    return { raceDeadline, instanceDeadline };
}

/**
 * Returns the Unix timestamp an instance's main shutdown phase must finish by,
 * leaving the smaller of the instance's final phase max or 30% of
 * shutdownTimeout before instanceDeadline for the final phase.
*/
export function getPhaseDeadline(
    instanceDeadline: number,
    shutdownTimeout: number,
    assignment: keyof typeof FINAL_PHASE_MAX
): number {
    const finalPhaseReserve = Math.min(
        FINAL_PHASE_MAX[assignment], Math.round(shutdownTimeout * 0.3)
    );
    return instanceDeadline - finalPhaseReserve;
}

export function waitForWorkerShutdown(deadline: number, context: Context, eventName: string) {
    const shutdownTimeout = msUntilUnixTime(deadline);
    const events = context.apis.foundation.getSystemEvents();

    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            events.removeListener(eventName, handler);
            reject(new Error('Timeout waiting for worker to shutdown'));
        }, shutdownTimeout);

        function handler(err: Error) {
            clearTimeout(timeoutId);
            if (isError(err)) {
                reject(err);
            } else {
                resolve(true);
            }
        }
        events.once(eventName, handler);
    });
}

/* istanbul ignore next */
export function shutdownHandler(
    context: Context,
    shutdownFn: (deadline: number, event: string, err?: Error) => Promise<void>
) {
    const assignment = context.assignment
        || process.env.NODE_TYPE
        || process.env.assignment
        || 'unknown-assignment';

    // this is native clustering only
    const isProcessRestart = process.env.__process_restart;
    const api = {
        exiting: false,
        exit
    };

    const shutdownTimeout = context.sysconfig.teraslice.shutdown_timeout;

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

    let startTime: number;

    function exitingIn() {
        if (!api.exiting) {
            return `exiting in ${ms(shutdownTimeout)}...`;
        }

        const elapsed = Date.now() - startTime;
        return `already shutting down, remaining ${ms(shutdownTimeout - elapsed)}`;
    }

    async function callShutdownFn(deadline: number, event: string, err?: Error) {
        // avoid failing before the promise is try / catched in pRaceWithTimeout
        await pDelay(100);
        await shutdownFn(deadline, event, err);
    }

    async function shutdownWithTimeout(
        raceDeadline: number,
        instanceDeadline: number,
        event: string,
        err?: Error
    ) {
        const timeout = msUntilUnixTime(raceDeadline);
        await pRaceWithTimeout(
            callShutdownFn(instanceDeadline, event, err),
            timeout,
            (timeoutErr) => {
                logError(logger, timeoutErr, 'shutdown error after timeout');
            }
        );
    }

    async function exit(event: string, err?: Error) {
        if (api.exiting) return;

        if (err) {
            if (err.name.includes('Error')) {
                setStatusCode(1);
            }
        }
        api.exiting = true;
        startTime = Date.now();
        const { raceDeadline, instanceDeadline } = getShutdownDeadlines(
            startTime, shutdownTimeout
        );

        try {
            await shutdownWithTimeout(raceDeadline, instanceDeadline, event, err);
        } catch (error) {
            logError(logger, error, `${assignment} while shutting down`);
        } finally {
            await flushLogs();
            const code = process.exitCode != null ? process.exitCode : 0;
            logger.info(`${assignment} shutdown took ${ms(Date.now() - startTime)}, exit with ${code} status code`);
            process.exit();
        }
    }

    function setStatusCode(code: number) {
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

    process.once('unhandledRejection', (err: Error) => {
        logError(logger, err, `${assignment} received an unhandledRejection, ${exitingIn()}`);
        setStatusCode(1);
        exit('unhandledRejection', err);
    });

    // See https://github.com/trentm/node-bunyan/issues/246
    function handleStdError(err: Error) {
        // @ts-expect-error  TODO: fix error type
        if (err.code === 'EPIPE' || err.code === 'ERR_STREAM_DESTROYED') {
            // ignore
        } else {
            throw err;
        }
    }

    process.stdout.on('error', handleStdError);
    process.stderr.on('error', handleStdError);

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

import { promisify } from 'util';
import { debugLogger } from './logger';
import { isEmpty } from './utils';
import {
    isRetryableError,
    TSError,
    parseError
} from './errors';

const logger = debugLogger('utils:promises');

export interface PRetryConfig {
    /**
     * The number of retries to attempt before failing.
     * This does not include the initial attempt
     *
     * @default 3
    */
    retries: number;

    /**
     * The initial time to delay before retrying the function
     *
     * @default 500
    */
    delay: number;

    /**
     * The maximum time to delay when retrying in milliseconds
     *
     * @default 60000
    */
    maxDelay: number;

    /**
     * The backoff multiplier
     *
     * @default 2
    */
    backoff: number;

    /**
     * If set to true, this will set fail with fatalError to true
     */
    endWithFatal: boolean;

    /**
     * Set a error message prefix
     */
    reason?: string;

    /**
     * Log function for logging any errors that occurred
    */
    logError: (...args: any[]) => void;

    /**
     * If this not specified or is empty, all errors will be treated as retryable.
     * If any of the items in the array match the error message,
     * it will be considered retryable
     */
    matches?: (string|RegExp)[];
}

/**
 * A promise retry fn.
*/
export async function pRetry<T = any>(fn: PromiseFn<T>, options?: Partial<PRetryConfig>): Promise<T> {
    const config = Object.assign({
        retries: 3,
        delay: 500,
        maxDelay: 60000,
        backoff: 2,
        matches: [],
        logError: logger.warn,
    }, options);

    try {
        return await fn();
    } catch (_err) {
        let matches = true;

        if (!isEmpty(config.matches)) {
            const rawErr = parseError(_err);
            matches = config.matches.some((match) => {
                const reg = new RegExp(match);
                return reg.test(rawErr);
            });
        }

        const err = new TSError(_err, {
            reason: config.reason,
            withStack: true,
        });

        if (err.retryable == null) {
            err.retryable = matches;
        }

        if (isRetryableError(err) && config.retries > 1) {
            await pDelay(config.delay);

            config.retries--;
            config.delay *= config.backoff;

            if (config.delay > config.maxDelay) {
                config.delay = config.maxDelay;
            }

            config.logError('retry error, retrying...', err, config);
            return pRetry(fn, config);
        }

        err.retryable = false;
        if (config.endWithFatal) {
            err.fatalError = true;
        }

        throw err;
    }
}

/** promisified setTimeout */
export const pDelay = promisify(setTimeout);

/** promisified setImmediate */
export const pImmediate = promisify(setImmediate);

interface PromiseFn<T = any> {
    (...args: any[]): Promise<T>;
}

/** Async waterfall function */
export function waterfall(input: any, fns: PromiseFn[]): Promise<any> {
    return fns.reduce(async (last, fn) => {
        return fn(await last);
    }, input);
}

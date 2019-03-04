import { promisify } from 'util';
import { debugLogger } from './logger';
import { isEmpty } from './utils';
import {
    isRetryableError,
    TSError,
    parseError,
    isFatalError
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
        _currentDelay: 0,
        // @ts-ignore
        _context: undefined as PRetryContext,
    }, options);

    if (!config._currentDelay) {
        config._currentDelay = config.delay;
    }

    config._context = config._context || {
        startTime: Date.now(),
        attempts: 0,
    };

    config._context.attempts++;

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

        const context = {
            ...config._context,
            duration: Date.now() - config._context.startTime
        };

        const err = new TSError(_err, {
            reason: config.reason,
            context,
        });

        if (context.lastErr) {
            err.stack += `, caused by ${context.lastErr.stack}`;
        }
        config._context.lastErr = err;

        if (!isFatalError(err) && err.retryable == null) {
            err.retryable = matches;
        }

        if (isRetryableError(err) && config.retries > 1) {
            await pDelay(config._currentDelay);

            config.retries--;
            config._currentDelay = getBackoffDelay(
                config._currentDelay,
                config.backoff,
                config.maxDelay,
                config.delay
            );

            config.logError(err, 'retry error, retrying...', {
                ...config,
                _context: null
            });
            return pRetry(fn, config);
        }

        err.retryable = false;
        if (config.endWithFatal) {
            err.fatalError = true;
        }

        throw err;
    }
}

/**
 * Get backoff delay that will safe to retry and is slightly staggered
*/
export function getBackoffDelay(current: number, factor: number = 2, max = 60000, min = 500): number {
    // jitter is a floating point number between -0.2 and 0.8
    const jitter = Math.random() * 0.8 + -0.2;

    let n = current;
    // ensure the number does not go below the min val
    if (n < min) n = min;

    // multiple the current backoff value by input factor and jitter
    n *= (factor + jitter);

    // ensure the number does not exceed the max val
    if (n > max) n = max;

    // round it so it remains a whole number
    return Math.round(n);
}

type PRetryContext = {
    lastErr?: Error;
    attempts: number;
    startTime: number;
};

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

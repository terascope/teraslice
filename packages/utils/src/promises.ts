import { debugLogger } from './logger';
import { toHumanTime, trackTimeout } from './dates';
import {
    isRetryableError,
    TSError,
    parseError,
    isFatalError
} from './errors';

const logger = debugLogger('utils:promises');

/** promisified setTimeout */
export function pDelay<T = undefined>(delay = 0, arg?: T): Promise<T> {
    return new Promise<T>((resolve) => {
        setTimeout(resolve, delay, arg);
    });
}

let supportsSetImmediate = false;
try {
    if (typeof globalThis.setImmediate === 'function') {
        supportsSetImmediate = true;
    }
} catch (err) {
    supportsSetImmediate = false;
}

let supportsNextTick = false;
try {
    if (typeof globalThis.process.nextTick === 'function') {
        supportsNextTick = true;
    }
} catch (err) {
    supportsNextTick = false;
}

/** promisified process.nextTick,setImmediate or setTimeout depending on your environment */
export function pImmediate<T = undefined>(arg?: T): Promise<T> {
    return new Promise<T>((resolve) => {
        if (supportsNextTick) {
            process.nextTick(resolve, arg);
        } else if (supportsSetImmediate) {
            if (arg != null) setImmediate(resolve, arg);
            else setImmediate(resolve as () => void);
        } else {
            setTimeout(resolve, 0, arg);
        }
    });
}

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
    matches?: (string | RegExp)[];
}

/**
 * A promise retry fn.
 */
export async function pRetry<T = any>(
    fn: PromiseFn<T>,
    options?: Partial<PRetryConfig>
): Promise<T> {
    const config = Object.assign(
        {
            retries: 3,
            delay: 500,
            maxDelay: 60000,
            backoff: 2,
            matches: [],
            _currentDelay: 0,
            // @ts-expect-error
            _context: undefined as PRetryContext,
        },
        options
    );

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

        if (config.matches?.length) {
            const rawErr = parseError(_err);
            matches = config.matches.some((match) => {
                const reg = new RegExp(match);
                return reg.test(rawErr);
            });
        }

        const context = {
            ...config._context,
            duration: Date.now() - config._context.startTime,
        };

        const err = new TSError(_err, {
            reason: config.reason,
            context,
        });

        if (_err && _err.stack) {
            err.stack += `\n${_err.stack
                .split('\n')
                .slice(1)
                .join('\n')}`;
        }

        if (!isFatalError(err) && err.retryable == null) {
            err.retryable = matches;
        }

        if (isRetryableError(err) && config.retries > 1) {
            config.retries--;
            config._currentDelay = getBackoffDelay(
                config._currentDelay,
                config.backoff,
                config.maxDelay,
                config.delay
            );

            await pDelay(config._currentDelay);

            if (config.logError) {
                config.logError(err, 'retry error, retrying...', {
                    ...config,
                    _context: null,
                });
            }
            return pRetry(fn, config);
        }

        err.retryable = false;
        if (config.endWithFatal) {
            err.fatalError = true;
        }

        throw err;
    }
}

export type PWhileOptions = {
    /** @defaults to -1 which is never */
    timeoutMs?: number;

    /** @defaults to "Request" */
    name?: string;

    /** enable jitter to stagger requests */
    enabledJitter?: boolean;
};

/**
 * Run a function until it returns true or throws an error
 */
export async function pWhile(fn: PromiseFn, options: PWhileOptions = {}): Promise<void> {
    const timeoutMs = options.timeoutMs != null ? options.timeoutMs : -1;
    const minJitter = timeoutMs > 100 ? timeoutMs : 100;
    const name = options.name || 'Request';
    const startTime = Date.now();

    const checkTimeout = trackTimeout(timeoutMs);
    let running = false;
    let interval: any;

    const promise = new Promise<void>((resolve, reject) => {
        interval = setInterval(async () => {
            if (running) return;
            running = true;

            const timeout = checkTimeout();
            if (timeout !== false) {
                reject(
                    new TSError(`${name} timeout after ${toHumanTime(timeout)}`, {
                        statusCode: 503,
                    })
                );
                return;
            }

            try {
                const result = await fn();
                if (result) {
                    resolve();
                    return;
                }

                if (options.enabledJitter) {
                    const delay = getBackoffDelay(minJitter, 3, timeoutMs / 2, minJitter);
                    await pDelay(delay);
                }

                running = false;
            } catch (err) {
                reject(
                    new TSError(err, {
                        context: {
                            elapsed: Date.now() - startTime,
                        },
                    })
                );
            }
        }, 1);
    });

    try {
        await promise;
    } finally {
        clearInterval(interval);
    }
}

/**
 * Get backoff delay that will safe to retry and is slightly staggered
 */
export function getBackoffDelay(
    current: number,
    factor = 2,
    max = 60000,
    min = 500
): number {
    // jitter is a floating point number between -0.2 and 0.8
    const jitter = Math.random() * 0.8 + -0.2;

    let n = current;
    // ensure the number does not go below the min val
    if (n < min) n = min;

    // multiple the current backoff value by input factor and jitter
    n *= factor + jitter;

    // ensure the number does not exceed the max val
    if (n > max) n = max;

    // round it so it remains a whole number
    return Math.round(n);
}

type PRetryContext = {
    attempts: number;
    startTime: number;
};

interface PromiseFn<T = any> {
    (...args: any[]): Promise<T>;
}

/** Async waterfall function */
export function waterfall(input: unknown, fns: PromiseFn[], addBreak = false): Promise<any> {
    let i = 0;
    return fns.reduce(async (last, fn) => {
        if (i++ === 0 && addBreak) await pImmediate();
        return fn(await last);
    }, input) as any;
}

/**
 * Run multiple promises at once, and resolve/reject when the first completes
 */
export function pRace(promises: Promise<any>[], logError?: (err: any) => void): Promise<any> {
    if (!promises || !Array.isArray(promises)) {
        throw new Error('Invalid promises argument, must be an array');
    }
    return new Promise((resolve, reject) => {
        let done = false;
        promises.forEach(async (promise) => {
            try {
                const result = await promise;
                resolve(result);
                done = true;
            } catch (err) {
                if (done) {
                    if (logError) logError(err);
                    else logger.error(err, 'pRace reject with an error after complete');
                }
                reject(err);
            }
        });
    });
}

/**
 * Similar to pRace but with
 */
export async function pRaceWithTimeout(
    promises: Promise<any>[] | Promise<any>,
    timeout: number,
    logError?: (err: any) => void
): Promise<any> {
    if (!timeout || typeof timeout !== 'number') {
        throw new Error('Invalid timeout argument, must be a number');
    }
    let timeoutId: any;

    try {
        const pTimeout = new Promise((resolve) => {
            // add unref to avoid keeping the process open
            timeoutId = setTimeout(resolve, timeout);
            timeoutId.unref();
        });
        const _promises = Array.isArray(promises) ? promises : [promises];

        await pRace([..._promises, pTimeout], logError);
    } catch (err) {
        if (logError) logError(err);
        else console.error(err);
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * An alternative to Bluebird.defer: http://bluebirdjs.com/docs/api/deferred-migration.html
 * Considered bad practice in most cases, use the Promise constructor
*/
export function pDefer(): {
    resolve: (value?: unknown) => void,
    reject: (reason?: any) => void,
    promise: Promise<any>
} {
    let resolve: (value?: unknown) => void;
    let reject: (reason?: any) => void;

    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });

    return {
        resolve: resolve!,
        reject: reject!,
        promise
    };
}

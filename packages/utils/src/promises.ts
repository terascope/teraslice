import { isFatalError } from './ts-error';
import { promisify } from 'util';

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
     * Add this to add an additional check to verify a function
    */
    isRetryable: (err: any) => boolean;
    /**
     * Format the error before throwing it
    */
    normalizeError: (err: any) => any;
}

/**
 * A promise retry fn
*/
export async function pRetry<T = any>(fn: PromiseFn<T>, options: Partial<PRetryConfig>): Promise<T> {
    const config = Object.assign({
        retries: 3,
        delay: 500,
        isRetryable() {
            return true;
        },
        normalizeError(err: any) {
            return err;
        }
    }, options);

    try {
        return await fn();
    } catch (err) {
        const retryable = !isFatalError(err) && config.isRetryable(err);

        if (retryable && config.retries > 1) {
            await pDelay(config.delay);

            config.retries--;
            config.delay *= 2;
            return pRetry(fn, config);
        }

        throw config.normalizeError(err);
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

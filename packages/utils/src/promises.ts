import { promisify } from 'util';

/**
 * A promise retry fn
*/
export async function pRetry<T = any>(fn: PromiseFn<T>, retries: number = 3, delay: number = 500): Promise<T> {
    try {
        return await fn();
    } catch (err) {
        if (err && (err.fatalError || err.stop)) {
            throw err;
        }

        if (retries > 1) {
            await pDelay(delay);
            return pRetry(fn, retries - 1, delay * 2);
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

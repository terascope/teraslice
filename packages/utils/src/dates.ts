import { bigIntToJSON, toInteger } from './numbers';

/**
 * A helper function for making an ISODate string
 */
export function makeISODate(value?: Date|number|string|null|undefined): string {
    if (value == null) return new Date().toISOString();
    const date = getValidDate(value);
    if (date === false) {
        throw new Error(`Invalid date ${date}`);
    }
    return new Date(value).toISOString();
}

/** A simplified implementation of moment(new Date(val)).isValid() */
export function isValidDate(val: unknown): boolean {
    return getValidDate(val as any) !== false;
}

/**
 * Coerces value into a valid date, returns false if it is invalid
*/
export function getValidDate(val: Date|number|string|null|undefined): Date | false {
    if (val == null) return false;
    if (val instanceof Date) {
        if (!isValidDateInstance(val)) {
            return false;
        }
        return val;
    }

    if (typeof val === 'bigint') {
        // eslint-disable-next-line no-param-reassign
        val = bigIntToJSON(val);
        if (typeof val === 'string') return false;
    }

    if (typeof val === 'number' && (!Number.isSafeInteger(val))) {
        return false;
    }

    const d = new Date(val);
    if (isValidDateInstance(d)) return d;
    return false;
}

export function isValidDateInstance(val: unknown): val is Date {
    // this has to use isNaN not Number.isNaN
    return val instanceof Date && !isNaN(val as any);
}

/** Ensure unix time */
export function getTime(val?: string|number|Date): number | false {
    if (val == null) return Date.now();
    const result = getValidDate(val);
    if (result === false) return false;
    return result.getTime();
}

export function getUnixTime(val?: string|number|Date): number | false {
    const time = getTime(val);
    if (time !== false) return Math.floor(time / 1000);
    return time;
}

/**
 * Checks to see if an input is a unix time
*/
export function isUnixTime(input: unknown, allowBefore1970 = true): input is number {
    const value = toInteger(input);
    if (value === false) return false;
    if (allowBefore1970) return true;
    return value >= 0;
}

/**
 * A functional version of isUnixTime
*/
export function isUnixTimeFP(allowBefore1970?: boolean) {
    return function _isUnixTime(input: unknown): input is number {
        return isUnixTime(input, allowBefore1970);
    };
}

/**
 * track a timeout to see if it expires
 * @returns a function that will returns false if the time elapsed
 */
export function trackTimeout(timeoutMs: number): () => number | false {
    const startTime = Date.now();

    return (): false | number => {
        const elapsed = Date.now() - startTime;
        if (timeoutMs > -1 && elapsed > timeoutMs) {
            return elapsed;
        }
        return false;
    };
}

/** converts smaller than a week milliseconds to human readable time */
export function toHumanTime(ms: number): string {
    const ONE_SEC = 1000;
    const ONE_MIN = ONE_SEC * 60;
    const ONE_HOUR = ONE_MIN * 60;
    const ONE_DAY = ONE_HOUR * 24;
    const minOver = 1.5;
    if (ms > ONE_DAY * minOver && ms < ONE_DAY * 7) {
        return `~${Math.round((ms * 100) / ONE_DAY) / 100}day`;
    }
    if (ms > ONE_HOUR * minOver) return `~${Math.round((ms * 100) / ONE_HOUR) / 100}hr`;
    if (ms > ONE_MIN * minOver) return `~${Math.round((ms * 100) / ONE_MIN) / 100}min`;
    if (ms > ONE_SEC * minOver) {
        return `~${Math.round((ms * 100) / ONE_SEC) / 100}sec`;
    }
    if (ms < ONE_SEC * minOver) {
        return `${Math.round(ms)}ms`;
    }
    return `~${Math.round((ms * 100) / ONE_DAY) / 100}day`;
}

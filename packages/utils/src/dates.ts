/**
 * A helper function for making an ISODate string
 */
export function makeISODate(): string {
    return new Date().toISOString();
}

/** A simplified implemation of moment(new Date(val)).isValid() */
export function isValidDate(val: any): boolean {
    return getValidDate(val) !== false;
}

/** Check if the data is valid and return if it is */
export function getValidDate(val: any): Date | false {
    if (val == null) return false;
    if (isValidDateInstance(val)) return val;
    if (typeof val === 'number'
        && (val <= 0 || !Number.isSafeInteger(val))) {
        return false;
    }
    const d = new Date(val);
    return isValidDateInstance(d) && d;
}

export function isValidDateInstance(val: Date): boolean {
    return val instanceof Date && !isNaN(val as any);
}

/** Ensure unix time */
export function getUnixTime(val?: string|number|Date): number | false {
    if (val == null) return Date.now();
    const result = getValidDate(val);
    if (result === false) return false;
    return result.getTime();
}

/**
 * track a timeout to see if it expires
 * @returns a function that will returns false if the time elapsed
 */
export function trackTimeout(timeoutMs: number) {
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

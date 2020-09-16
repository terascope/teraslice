/** A simplified implementation of lodash isInteger */
export function isInteger(val: unknown): val is number {
    if (typeof val !== 'number') return false;
    return Number.isInteger(val);
}

/** A native implementation of lodash random */
export function random(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Check if an input is a number */
export function isNumber(input: unknown): input is number {
    return typeof input === 'number' && !Number.isNaN(input);
}

/** Convert any input to a number, return Number.NaN if unable to convert input  */
export function toNumber(input: unknown): number {
    if (typeof input === 'number') return input;

    return Number(input);
}

/** Check if value is a bigint */
export function isBigInt(input: unknown): input is bigint {
    return typeof input === 'bigint';
}

/** Convert any input to a bigint */
export function toBigInt(input: unknown): bigint {
    if (typeof input === 'bigint') return input;

    const str = String(input);
    if (str.includes('.')) {
        return BigInt(parseInt(str, 10));
    }

    return BigInt(input);
}

/** Convert any input to a integer, return false if unable to convert input  */
export function toInteger(input: unknown): number | false {
    if (isInteger(input)) return input;
    const val = Number.parseInt(input as string, 10);
    if (isNumber(val)) return val;
    return false;
}

/**
 * Like parseList, except it returns numbers
 */
export function parseNumberList(input: unknown): number[] {
    let items: (number | string)[] = [];

    if (typeof input === 'string') {
        items = input.split(',');
    } else if (Array.isArray(input)) {
        items = input;
    } else if (isNumber(input)) {
        return [input];
    } else {
        return [];
    }

    return items
        // filter out any empty string
        .filter((item) => {
            if (item == null) return false;
            if (typeof item === 'string' && !item.trim().length) return false;
            return true;
        })
        .map(toNumber)
        .filter(isNumber) as number[];
}

export function inNumberRange(input: number,
    args: { min?: number; max?: number; inclusive?: boolean }): boolean {
    const min = args.min ? args.min : -Infinity;
    const max = args.max ? args.max : Infinity;

    if (args.inclusive) {
        return (input >= min && input <= max);
    }

    return (input > min && input < max);
}

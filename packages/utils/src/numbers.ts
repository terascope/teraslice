/** A simplified implemation of lodash isInteger */
export function isInteger(val: any): val is number {
    if (typeof val !== 'number') return false;
    return Number.isInteger(val);
}

/** A native implemation of lodash random */
export function random(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Check if an input is a number */
export function isNumber(input: any): input is number {
    return typeof input === 'number' && !Number.isNaN(input);
}

/** Convert any input to a number, return Number.NaN if unable to convert input  */
export function toNumber(input: any): number {
    if (typeof input === 'number') return input;

    return Number(input);
}

/** Convert any input to a integer, return false if unable to convert input  */
export function toInteger(input: any): number | false {
    if (Number.isInteger(input)) return input;
    const val = Number.parseInt(input, 10);
    if (isNumber(val)) return val;
    return false;
}

/**
 * Like parseList, except it returns numbers
 */
export function parseNumberList(input: any): number[] {
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
        .filter(item => {
            if (item == null) return false;
            if (typeof item === 'string' && !item.trim().length) return false;
            return true;
        })
        .map(toNumber)
        .filter(isNumber) as number[];
}

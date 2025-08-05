import { FieldType } from '@terascope/types';
import { isArrayLike } from './arrays.js';
import { getTypeOf } from './deps.js';
import { isKey } from './objects.js';

let supportsBigInt = true;
try {
    if (typeof globalThis.BigInt === 'undefined') {
        supportsBigInt = false;
    }
} catch (err) {
    supportsBigInt = false;
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

/** Will throw if converted number is NaN */
export function toNumberOrThrow(input: unknown): number {
    const num = toNumber(input);

    if (!isNumber(num)) {
        throw new Error(`Could not convert ${input} to a number`);
    }
    return num;
}

/** Check if value is a bigint */
export function isBigInt(input: unknown): input is bigint {
    return typeof input === 'bigint';
}

/** Convert any input to a bigint */
export function toBigInt(input: unknown): bigint | false {
    if (!supportsBigInt) {
        throw new Error('BigInt isn\'t supported in this environment');
    }

    try {
        return toBigIntOrThrow(input);
    } catch {
        return false;
    }
}

const _maxBigInt: bigint = supportsBigInt
    ? BigInt(Number.MAX_SAFE_INTEGER)
    : (Number.MAX_SAFE_INTEGER as any);

/** Convert any input to a bigint */
export function toBigIntOrThrow(input: unknown): bigint {
    if (typeof input === 'object') {
        throw new TypeError(`Expected ${input} (${getTypeOf(input)}) to be parsable to a float`);
    }

    if (isBigInt(input)) return input;

    if (!supportsBigInt) {
        throw new Error('BigInt isn\'t supported in this environment');
    }

    if (
        typeof input === 'number' && input < Number.MAX_SAFE_INTEGER
    ) {
        return BigInt(Math.trunc(input));
    }

    if (!isNumberLike(input)) {
        throw new TypeError(`Expected ${input} (${getTypeOf(input)}) to be parsable to a BigInt`);
    }

    let big: bigint;

    if (typeof input === 'string' && input.includes('.')) {
        big = BigInt(Number.parseInt(input, 10));
    } else {
        big = BigInt(input as string | number | bigint);
    }

    // for some reason the number
    // is incorrect when given a number
    // greater than the max safe integer
    if (big > _maxBigInt) {
        return big + BigInt(1);
    }
    return big;
}

/**
 * Convert a BigInt to either a number or a string
*/
export function bigIntToJSON(int: bigint): string | number {
    if (typeof int === 'number') return int;
    if (int <= _maxBigInt) {
        return Number.parseInt(int.toString(10), 10);
    }
    // for some reason bigints ending being +1
    return (int - BigInt(1)).toString(10);
}

/**
 * A stricter check for verifying a number string
 * @todo this needs to be smarter
*/
export function isNumberLike(input: unknown): boolean {
    if (typeof input === 'number') return true;
    if (typeof input === 'object') return false;
    if (typeof input === 'boolean') return false;

    // https://regexr.com/5cljt
    return /^\s*[+-]{0,1}[\d,]+(\.[\d]+){0,1}\s*$/.test(String(input));
}

/** A simplified implementation of lodash isInteger */
export function isInteger(val: unknown): val is number {
    if (typeof val !== 'number') return false;
    return Number.isSafeInteger(val);
}

/** Convert an input to a integer, return false if unable to convert input  */
export function toInteger(input: unknown): number | false {
    try {
        return toIntegerOrThrow(input);
    } catch (err) {
        return false;
    }
}

/** Convert an input to a integer or throw */
export function toIntegerOrThrow(input: unknown): number {
    if (typeof input === 'object') {
        throw new TypeError(`Expected ${input} (${getTypeOf(input)}) to be parsable to a integer`);
    }

    if (isBigInt(input)) {
        const val = bigIntToJSON(input);

        if (typeof val === 'string') {
            throw new TypeError(`Expected ${val} (${getTypeOf(input)}) to be parsable to a integer`);
        }
        return val;
    }

    if (isInteger(input) || isFloat(input)) return Math.trunc(input);

    if (!isNumberLike(input)) {
        throw new TypeError(`Expected ${input} (${getTypeOf(input)}) to be parsable to a integer`);
    }

    const val = Number.parseInt(input as any, 10);
    if (isInteger(val)) return val;

    throw new TypeError(`Expected ${val} (${getTypeOf(input)}) to be parsable to a integer`);
}

/** Verify the input is float  */
export function isFloat(val: unknown): val is number {
    if (!isNumber(val)) return false;
    if (val === Number.POSITIVE_INFINITY) return true;
    if (val === Number.NEGATIVE_INFINITY) return true;
    return true;
}

/** Convert an input to a float, return false if unable to convert input  */
export function toFloat(input: unknown): number | false {
    try {
        return toFloatOrThrow(input);
    } catch (err) {
        return false;
    }
}

/** Convert an input to a float or throw */
export function toFloatOrThrow(input: unknown): number {
    if (typeof input === 'object') {
        throw new TypeError(`Expected ${input} (${getTypeOf(input)}) to be parsable to a float`);
    }

    if (isFloat(input)) return input;
    if (isBigInt(input)) {
        const val = bigIntToJSON(input);
        if (typeof val === 'string') {
            throw new TypeError(`Expected ${val} (${getTypeOf(input)}) to be parsable to a float`);
        }
        return val;
    }

    if (!isNumberLike(input)) {
        throw new TypeError(`Expected ${input} (${getTypeOf(input)}) to be parsable to a float`);
    }

    const val = Number.parseFloat(input as any);
    if (isFloat(val)) return val;

    throw new TypeError(`Expected ${val} (${getTypeOf(input)}) to be parsable to a float`);
}

/**
 * Like parseList, except it returns numbers
 */
export function parseNumberList(input: unknown): number[] {
    let items: (number | string)[];

    if (typeof input === 'string') {
        items = input.split(',');
    } else if (Array.isArray(input)) {
        items = input;
    } else if (isArrayLike(input)) {
        items = Array.from(input);
    } else if (isNumber(input)) {
        return [input];
    } else {
        return [];
    }

    return items
        // filter out any empty string
        .filter(isConvertibleToNumber)
        .map(toNumber)
        .filter(isNumber);
}
function isConvertibleToNumber(item: unknown): boolean {
    if (item == null) return false;
    if (typeof item === 'string' && !item.trim().length) return false;
    return true;
}

export interface InNumberRangeArg {
    min?: number;
    max?: number;
    inclusive?: boolean;
}

/**
 * Returns true if number is between min or max value provided
 *
 *  @example
 *      inNumberRange(42, { min: 0, max: 100}); // true
 *      inNumberRange(-42, { min:0 , max: 100 }); // false
 *      inNumberRange(42, { min: 0, max: 42 }); // false
 *      inNumberRange(42, { min: 0, max: 42, inclusive: true }) // true
*/
export function inNumberRange(input: unknown, args: InNumberRangeArg): input is number {
    if (!isNumber(input) && !isBigInt(input)) return false;

    const min = args.min == null ? Number.NEGATIVE_INFINITY : args.min;
    const max = args.max == null ? Number.POSITIVE_INFINITY : args.max;

    if (args.inclusive) {
        return (input >= min && input <= max);
    }

    return (input > min && input < max);
}

export function inNumberRangeFP(args: InNumberRangeArg) {
    return function _inNumberRangeFP(input: unknown): input is number {
        return inNumberRange(input, args);
    };
}

/**
 * Returns a truncated number to nth decimal places.
 *
 * @param fractionDigits The number of decimal points to round to.
 * @param truncate If this is true the number will not be rounded
*/
export function setPrecision(
    input: unknown,
    fractionDigits: number,
    truncate = false
): number {
    if (Number.isNaN(input)
        || input === Number.POSITIVE_INFINITY
        || input === Number.NEGATIVE_INFINITY) {
        return input as number;
    }

    const num = toFloatOrThrow(input);
    if (!truncate) {
        return parseFloat(num.toFixed(fractionDigits));
    }
    return parseFloat(
        setPrecisionFromString(num.toString(), fractionDigits)
    );
}

/**
 * A functional programming version of setPrecision
 *
 * @param fractionDigits The number of decimal points to round to.
 * @param truncate If this is true the number will not be rounded
*/
export function setPrecisionFP(
    fractionDigits: number,
    truncate = false
): (input: unknown) => number {
    return function _setPrecision(input) {
        return setPrecision(input, fractionDigits, truncate);
    };
}

/**
 * this will always truncate (not round)
*/
function setPrecisionFromString(
    input: string,
    fractionDigits: number,
): string {
    const [int, points] = input.toString().split('.');
    if (!points) return int || '0';

    const remainingPoints = points.slice(0, fractionDigits);
    if (!remainingPoints) return int || '0';
    return `${int || '0'}.${remainingPoints}`;
}

/**
 * Convert a fahrenheit value to celsius, this will return a precision of
 * 2 decimal points
*/
export function toCelsius(input: unknown): number {
    const num = toFloatOrThrow(input);
    const cNum = (num - 32) * (5 / 9);

    return parseFloat(cNum.toFixed(2));
}

/**
 * Convert a celsius value to fahrenheit, this will return a precision of
 * 2 decimal points
*/
export function toFahrenheit(input: unknown): number {
    const num = toFloatOrThrow(input);
    const fNum = ((9 / 5) * num) + 32;

    return parseFloat(fNum.toFixed(2));
}

/**
 * A number in javascript is a double-precision 64-bit
 * binary format IEEE 754 value, much bigger than a regular
 * classical int value, any higher than that should be a bigint
 */
const INT_SIZES = {
    [FieldType.Byte]: { min: -128, max: 127 },
    [FieldType.Short]: { min: -32_768, max: 32_767 },
    [FieldType.Integer]: { min: Number.MIN_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER },
} as const;

function _validateNumberFieldType(input: unknown, type: FieldType): number {
    const int = toIntegerOrThrow(input);

    if (isKey(INT_SIZES, type)) {
        const { max, min } = INT_SIZES[type];
        if (int >= max) {
            throw new TypeError(`Invalid byte, value of ${int} is greater than maximum size of ${max}`);
        }

        if (int <= min) {
            throw new TypeError(`Invalid byte, value of ${int} is less than minimum size of ${min}`);
        }
    }

    return int;
}

export function validateByteNumber(input: unknown): number {
    return _validateNumberFieldType(input, FieldType.Byte);
}

export function validateShortNumber(input: unknown): number {
    return _validateNumberFieldType(input, FieldType.Short);
}

export function validateIntegerNumber(input: unknown): number {
    return _validateNumberFieldType(input, FieldType.Integer);
}

export function validateNumberType(type: FieldType) {
    return function _validateNumberType(input: unknown): number {
        return _validateNumberFieldType(input, type);
    };
}

export function isValidateNumberType(type: FieldType): (input: unknown) => boolean {
    const fn = validateNumberType(type);

    return function _isValidateNumberType(input: unknown): boolean {
        try {
            return fn(input) != null;
        } catch (_err) {
            return false;
        }
    };
}

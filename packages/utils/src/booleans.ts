import { getTypeOf } from './deps.js';
import { isKey } from './objects.js';
/**
 * Convert any input into a boolean, this will work with stringified boolean
 *
 * @example
 *
 *     toBoolean(1); // true
 *     toBoolean(0); // false
 *     toBoolean('1'); // true
 *     toBoolean('0'); // false
 *     toBoolean('yes'); // true
 *     toBoolean('NO'); // false
 *     toBoolean('true'); // true
 *     toBoolean('FALSE'); // false
*/
export function toBoolean(input: unknown): boolean {
    if (isFalsy(input)) return false;
    if (isTruthy(input)) return true;

    return Boolean(input);
}

const _falsy = Object.freeze({
    0: true,
    false: true,
    no: true,
});

const _truthy = Object.freeze({
    1: true,
    true: true,
    yes: true,
});

/**
 * Returns true if the value is a truthy like value
*/
export function isTruthy(input: unknown): boolean {
    if (input === true) return true;
    const val = typeof input === 'string' ? input.trim().toLowerCase() : String(input);
    return isKey(_truthy, val);
}

/**
 * Returns true if the value is a falsy like value
*/
export function isFalsy(input: unknown): boolean {
    if (input === false || input == null || input === '') return true;
    const val = typeof input === 'string' ? input.trim().toLowerCase() : String(input);
    return isKey(_falsy, val);
}

/**
 * Returns true if the input is a boolean
*/
export function isBoolean(input: unknown): input is boolean {
    return typeof input === 'boolean';
}

/**
 * Returns true if the input is like a boolean.
 * Use toBoolean to convert it to one.
 *
 * @example
 *
 *     isBooleanLike(); // false
 *     isBooleanLike(null); // true
 *     isBooleanLike(0); // true
 *     isBooleanLike('0'); // true
 *     isBooleanLike('false'); // true
 *     isBooleanLike('no'); // true
*/
export function isBooleanLike(input: unknown): boolean {
    return isFalsy(input) || isTruthy(input);
}

/** Will throw if input is not booleanLike, converts input to a Boolean */
export function toBooleanOrThrow(input: unknown): boolean {
    if (!isBooleanLike(input)) {
        throw new TypeError(`Expected ${input} (${getTypeOf(input)}) to be boolean like`);
    }

    return toBoolean(input);
}

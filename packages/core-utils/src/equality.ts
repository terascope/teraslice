import { isDataEntity } from './entities/utils.js';
import { isEqualWith } from './deps.js';
import { toBigIntOrThrow } from './numbers.js';

/**
 * Verify that two values are the same (uses a reference check).
 * Similar to === except two NaNs is considered the same
 * For deep equality use isDeepEqual
*/
export function isEqual<T>(target: T, input: unknown): input is T;
export function isEqual<T>(target: T, input: unknown): boolean;
export function isEqual<T>(target: T, input: unknown): input is T {
    return input === target || (Number.isNaN(target) && Number.isNaN(input));
}

/**
 * A functional version of isEqual
*/
export function isEqualFP<T>(target: T): (input: unknown) => input is T;
export function isEqualFP<T>(target: T): (input: unknown) => boolean;
export function isEqualFP<T>(target: T): (input: T) => input is T {
    return isEqual.bind(isEqual, target) as (input: T) => input is T;
}

/**
 * Compares two values and returns a boolean if they are the same.
 * Arrays are compared using original sorting, while object key ordering
 * doesn't matter.
 *
 * @example
        isDeepEqual({ key1: 1, key2: 2 }, { key2: 2, key1: 1 }) === true;
        isDeepEqual(null, null) === true;
        isDeepEqual(undefined, undefined) === true;
        isDeepEqual(NaN, NaN) === true;
        isDeepEqual(3, 3) === true
        isDeepEqual('hello', 'hello') === true
        isDeepEqual([1, 2, 3], [1, 2, 3]) === true
        isDeepEqual([{ some: 'obj' }], [{ some: 'obj' }]) === true

        isDeepEqual(undefined, null) === false;
        isDeepEqual([1, 2, 3], [1, 3, 2]) === false
        isDeepEqual([1, 2, 3], [1, 2, undefined, 3]) === false
        isDeepEqual(true, 'true') === false;
*/

export function isDeepEqual<T>(target: T, input: unknown): input is T;
export function isDeepEqual<T>(target: T, input: unknown): boolean;
export function isDeepEqual<T>(target: T, input: unknown): target is T {
    return isEqualWith(input, target, _isEqualCustomizer);
}

function _isEqualCustomizer(objValue: unknown, otherObject: unknown): boolean | undefined {
    const aIsEntity = isDataEntity(objValue);
    const bIsEntity = isDataEntity(otherObject);

    if (aIsEntity && bIsEntity) {
        return isDeepEqual(Object.assign({}, objValue), Object.assign({}, otherObject));
    }
    if (aIsEntity && !bIsEntity) {
        return isDeepEqual(Object.assign({}, objValue), otherObject);
    }
    if (!aIsEntity && bIsEntity) {
        return isDeepEqual(Object.assign({}, objValue), otherObject);
    }
}

/**
 * A functional version of isDeepEqual
*/
export function isDeepEqualFP<T>(target: T): (input: unknown) => input is T;
export function isDeepEqualFP<T>(target: T): (input: unknown) => boolean;
export function isDeepEqualFP<T>(target: unknown): (input: T) => input is T {
    return isDeepEqual.bind(isDeepEqual, target) as (input: T) => input is T;
}

/**
 * This will get the same type of a which is useful for comparison
 * (but not equality since that is more strict)
 */
function getSameType(value: unknown, other: unknown): [value: any, other: any] | undefined {
    const vType = typeof value;
    const oType = typeof other;

    // these are invalid comparisons
    if (vType === 'object' || oType === 'object') return;
    if (vType === 'undefined' || oType === 'undefined') return;

    if (vType === oType) return [value, other];
    if (vType === 'bigint' || oType === 'bigint') {
        return [toBigIntOrThrow(value), toBigIntOrThrow(other)];
    }
    return [value, other];
}

/**
 * Check if a value is greater than or equal to another
*/
export function isGreaterThanOrEqualTo(value: unknown, other: unknown): boolean {
    const res = getSameType(value, other);
    if (res == null) return false;
    return res[0] >= res[1];
}

/**
 * Check if a value is greater than or equal to another
*/
export function isGreaterThanOrEqualToFP(other: unknown): (value: unknown) => boolean {
    return function _isGreaterThanOrEqualTo(value) {
        const res = getSameType(value, other);
        if (res == null) return false;
        return res[0] >= res[1];
    };
}

/**
 * Check if a value is greater than another
*/
export function isGreaterThan(value: unknown, other: unknown): boolean {
    const res = getSameType(value, other);
    if (res == null) return false;
    return res[0] > res[1];
}

/**
 * Check if a value is greater than or equal to another
*/
export function isGreaterThanFP(other: unknown): (value: unknown) => boolean {
    return function _isGreaterThanTo(value) {
        const res = getSameType(value, other);
        if (res == null) return false;
        return res[0] > res[1];
    };
}

/**
 * Check if a value is less than or equal to another
*/
export function isLessThanOrEqualTo(value: unknown, other: unknown): boolean {
    const res = getSameType(value, other);
    if (res == null) return false;
    return res[0] <= res[1];
}

/**
 * Check if a value is less than or equal to another
*/
export function isLessThanOrEqualToFP(other: unknown): (value: unknown) => boolean {
    return function _isLessThanOrEqualTo(value) {
        const res = getSameType(value, other);
        if (res == null) return false;
        return res[0] <= res[1];
    };
}

/**
 * Check if a value is less than another
*/
export function isLessThan(value: unknown, other: unknown): boolean {
    const res = getSameType(value, other);
    if (res == null) return false;
    return res[0] < res[1];
}

/**
 * Check if a value is greater than or equal to another
*/
export function isLessThanFP(other: unknown): (value: unknown) => boolean {
    return function _isLessThan(value) {
        const res = getSameType(value, other);
        if (res == null) return false;
        return res[0] < res[1];
    };
}

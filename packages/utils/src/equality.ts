import _isEqualWith from 'lodash/isEqualWith';
import { isDataEntity } from './entities/utils';

/**
 * Verify that two values are the same (uses a reference check).
 * Similar to === except two NaNs is considered the same
 * For deep equality use isDeepEqual
*/
export function isEqual<T>(target: T, input: unknown): input is T;
export function isEqual<T extends unknown>(target: T, input: unknown): boolean;
export function isEqual<T>(target: T, input: unknown): input is T {
    return input === target || (Number.isNaN(target) && Number.isNaN(input));
}

/**
 * A functional version of isEqual
*/
export function isEqualFP<T>(target: T): (input: unknown) => input is T;
export function isEqualFP<T extends unknown>(target: T): (input: unknown) => boolean;
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
export function isDeepEqual<T extends unknown>(target: T, input: unknown): boolean;
export function isDeepEqual<T>(target: T, input: unknown): target is T {
    return _isEqualWith(input, target, _isEqualCustomizer);
}

function _isEqualCustomizer(objValue: unknown, otherObject: unknown): boolean|undefined {
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
export function isDeepEqualFP<T extends unknown>(target: T): (input: unknown) => boolean;
export function isDeepEqualFP<T>(target: unknown): (input: T) => input is T {
    return isDeepEqual.bind(isDeepEqual, target) as (input: T) => input is T;
}

/**
 * @deprecated use isDeepEqual instead
*/
export const isSame = isDeepEqual;

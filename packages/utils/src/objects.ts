import set from 'lodash.set';
import get from 'lodash.get';
import cloneDeep from 'lodash.clonedeep';
import isPlainObject from 'is-plain-object';

/** Check in input has a key */
export function has(data: object, key: any) {
    return key in data;
}

/**
 * A clone deep using `JSON.parse(JSON.stringify(input))`
*/
export function fastCloneDeep<T>(input: T): T {
    return JSON.parse(JSON.stringify(input));
}

/** Perform a shallow clone of an object to another, in the fastest way possible */
export function fastAssign<T, U>(target: T, source: U) {
    if (!isPlainObject(source)) {
        return target;
    }

    for (const [key, val] of Object.entries(source)) {
        target[key] = val;
    }

    return target;
}

// export a few dependencies
export {
    isPlainObject, cloneDeep, get, set
};

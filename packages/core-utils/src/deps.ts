/**
 * This file exports tiny facades over the external packages.
 * The behavior of a dependency can be overridden here
*/
import {
    has, set, get, unset,
    merge, debounce, padEnd,
    difference, throttle, chain,
    orderBy, shuffle, defaultsDeep,
    sortBy, range
} from 'lodash-es';
import { isPlainObject as _isPlainObject } from 'is-plain-object';
import _clone from 'shallow-clone';
import kindOf from 'kind-of';
import jsStringEscape from 'js-string-escape';
import pMap from 'p-map';
import { isKey } from './objects.js';

const multiFieldSort = sortBy;

/**
 * Detect if an object created by Object.create(null)
*/
function isNullObject(input: any): input is Record<string, any> {
    return input != null && typeof input === 'object' && input.constructor === undefined;
}

/**
 * Detect if value is a plain object, that is,
 * an object created by the Object constructor or one via Object.create(null)
*/
export function isPlainObject(input: unknown): boolean {
    if (input == null) return false;
    if (_isPlainObject(input)) return true;
    return false;
}

/**
 * Shallow clone an object
*/
export function clone(input: unknown): any {
    if (isNullObject(input)) {
        return Object.assign(Object.create(null), input);
    }
    return _clone(input);
}

// TODO: should I type this better
function _isDataEntity(input: any): input is Record<string, any> {
    return input && typeof input === 'object' && Boolean(input.__isDataEntity);
}

const _cloneTypeHandlers = Object.freeze({
    object(input: any): any {
        const descriptors = Object.getOwnPropertyDescriptors(input);

        for (const key in descriptors) {
            descriptors[key].value = cloneDeep(descriptors[key].value);
        }
        return Object.create(
            Object.getPrototypeOf(input),
            descriptors
        );
    },
    array(input: any): any {
        const res = new input.constructor(input.length);
        for (let i = 0; i < input.length; i++) {
            res[i] = cloneDeep(input[i]);
        }
        return res;
    },
});

export function cloneDeep<T = any>(input: T): T {
    const kind = kindOf(input);
    const handler = isKey(_cloneTypeHandlers, kind) ? _cloneTypeHandlers[kind] : clone;
    return handler(input);
}

/**
 * Determine the type of an input
 * @return a human friendly string that describes the input
 */

export function getTypeOf(val: any): string {
    if (val === undefined) return 'undefined';
    if (val === null) return 'null';

    if (_isDataEntity(val)) {
        if (val.constructor && val.constructor.name !== 'Object') {
            return val.constructor.name;
        }
        // since the DataEntity may not be a instance of a class
        // we need to return a fixed string DataEntity
        return 'DataEntity';
    }

    if (typeof val === 'object') {
        if (val.constructor && val.constructor.name) {
            return val.constructor.name;
        }
        if (val.prototype && val.prototype.name) {
            return val.prototype.name;
        }
    }

    const kind = kindOf(val);
    if (!kind || kind.length <= 1) return `${kind}`;
    return `${kind.charAt(0).toUpperCase()}${kind.slice(1)}`;
}

/** Escape characters in string and avoid double escaping */
export function escapeString(input: string | number): string {
    return jsStringEscape(`${input}`);
}

export {
    get,
    set,
    unset,
    has,
    merge,
    padEnd,
    pMap,
    debounce,
    difference,
    throttle,
    chain,
    orderBy,
    shuffle,
    defaultsDeep,
    multiFieldSort,
    range
};

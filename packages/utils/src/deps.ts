/**
 * This file exports tiny facades over the external packages.
 * The behaviour of a dependency can be overridden here
*/
import has from 'lodash.has';
import set from 'lodash.set';
import get from 'lodash.get';
import unset from 'lodash.unset';
import isPlainObject from 'is-plain-object';
import clone from 'shallow-clone';
import kindOf from 'kind-of';
import jsStringEscape from 'js-string-escape';
import geoHash from 'latlon-geohash';

function _isDataEntity(input: any): boolean {
    return input && typeof input === 'object' && Boolean(input.__isDataEntity);
}

function _cloneDataEntity(input: any) {
    const res = new input.constructor();
    // eslint-disable-next-line guard-for-in
    for (const key in input) {
        res[key] = cloneDeep(input[key]);
    }

    try {
        Object.defineProperty(res, '__IS_DATAENTITY_KEY', {
            value: true,
            configurable: false,
            enumerable: false,
            writable: false,
        });
    } catch (_err) {
        res.__IS_DATAENTITY_KEY = true;
    }

    try {
        Object.defineProperty(res, '__ENTITY_METADATA_KEY', {
            value: {},
            configurable: false,
            enumerable: false,
            writable: false,
        });
    // eslint-disable-next-line no-empty
    } catch (_err) {}

    if (input.___EntityMetadata) {
        res.___EntityMetadata.rawData = clone(input.___EntityMetadata.rawData);
        res.___EntityMetadata.metadata = cloneDeep(input.___EntityMetadata.metadata);
        res.___EntityMetadata.metadata._createTime = Date.now();
    } else {
        res.___EntityMetadata.metadata = {};
        res.___EntityMetadata.metadata._createTime = Date.now();
    }

    return res;
}

const _cloneTypeHandlers = Object.freeze({
    object(input: any): any {
        if (typeof input.constructor === 'function') {
            if (_isDataEntity(input)) {
                return _cloneDataEntity(input);
            }

            const res = new input.constructor();
            // eslint-disable-next-line guard-for-in
            for (const key in input) {
                res[key] = cloneDeep(input[key]);
            }
            return res;
        }
        return input;
    },
    DataEntity(input: any): any {
        return input;
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
    const handler = _cloneTypeHandlers[kindOf(input)] || clone;
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
export function escapeString(input: string|number): string {
    return jsStringEscape(`${input}`);
}

export {
    clone,
    isPlainObject,
    get,
    set,
    unset,
    has,
    geoHash
};

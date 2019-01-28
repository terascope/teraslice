import { cloneDeep, isPlainObject, uniq } from '@terascope/utils';
import nanoid from 'nanoid/async';

/**
 * A helper function for making an ISODate string
*/
export function makeISODate(): string {
    return new Date().toISOString();
}

/**
 * Make unique URL friendly id
*/
export function makeId(len = 12): Promise<string> {
    return nanoid(len);
}

/**
 * Deep copy two levels deep (useful for mapping and schema)
*/
export function addDefaults(source: object, from: object = {}) {
    const output = cloneDeep(source);
    const _mapping = cloneDeep(from);

    for (const [key, val] of Object.entries(_mapping)) {
        if (output[key] != null) {
            if (isPlainObject(val)) {
                output[key] = Object.assign(output[key], val);
            } else if (Array.isArray(val)) {
                output[key] = uniq(output[key].concat(val));
            } else {
                output[key] = val;
            }
        }
    }

    return output;
}

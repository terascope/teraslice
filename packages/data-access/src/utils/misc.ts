import * as ts from '@terascope/utils';
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
    const output = ts.cloneDeep(source);
    const _mapping = ts.cloneDeep(from);

    for (const [key, val] of Object.entries(_mapping)) {
        if (output[key] != null) {
            if (ts.isPlainObject(val)) {
                output[key] = Object.assign(output[key], val);
            } else if (Array.isArray(val)) {
                output[key] = ts.concat(output[key], val);
            } else {
                output[key] = val;
            }
        }
    }

    return output;
}

export function trimAndLower(input: string): string {
    return trim(input).toLowerCase();
}

export function trim(input: string): string {
    if (!input || !ts.isString(input)) return '';
    return input.trim();
}

export function toInstanceName(name: string): string {
    return ts.firstToUpper(trim(name).replace(/s$/, ''));
}

import _ from 'lodash';
import * as ts from '@terascope/utils';
import ipaddr from 'ipaddr.js';
import { Repository, ValidationResults } from '../interfaces';

export const repository: Repository = {
    isBoolean: { fn: isBoolean, config: {} },
    isBooleanLike: { fn: isBooleanLike, config: {} },
    isEmail: { fn: isEmail, config: {} },
    isString: { fn: isString, config: {}},
    validValue: { fn: validValue, config: { }}
};


export function isBoolean(input: string): boolean {
    return ts.isBoolean(input);
}

export function isBooleanLike(input: string): boolean {
    return ts.isBooleanLike(input);
}

export function isEmail(input: string): boolean {
    // eslint-disable-next-line
    const regex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

    return isString(input) && input.toLowerCase().match(regex) !== null;
}

export function isString(input: any): boolean {
    return ts.isString(input);
}

export function isInteger(input: any, options?: { min?: number, max?: number}): boolean {
    // should this try to coerce the input to a number? before an int check?
    // like '10' -> 10
    const isInt = !isBoolean(input) && Number.isInteger(Number(input));

    if (!isInt) return false;

    let minRange = true;
    let maxRange = true;
    if(options) {
        if (options.min != null) {
            minRange = Number.parseInt(input) > options.min; 
        }

        if (options.max != null) {
            maxRange = Number.parseInt(input) < options.max;
        }
    }

    return isInt && minRange && maxRange;
}

export function validValue(input: any, options?: { invalidValues: any[] }): boolean {
    if (options && options.invalidValues) {
        return input != null && !options.invalidValues.includes(input);
    }

    return input != null;
}

export function isTimestamp(input: any) {
    // string must be a recognized date format, milliseconds or seconds
    if (!isInteger(input) || _.isDate(input)) {
        return !isNaN(Date.parse(input));
    }

    // if it is a number then it must have at 10 digits or 13
    return `${input}`.length === 10 || `${input}`.length === 13;
}

export function isPublicIp(input: any, options?: { private: boolean }) {
    let range;
    let result = true;

    try {
        range = ipaddr.parse(input).range();
    } catch (e) {
        return false;
    }

    // ipv6 private is parsed as uniqueLocal
    if (range === 'private' || range === 'uniqueLocal') {
        result = false;
    }

    if (options && options.private) return !result;

    return result;
}

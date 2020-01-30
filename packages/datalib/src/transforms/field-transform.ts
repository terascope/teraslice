import _ from 'lodash';
import * as ts from '@terascope/utils';
import * as valid from '../validations/field-validator';
import { Repository } from '../interfaces';

export const respoitory: Repository = {
    uppercase: { fn: uppercase, config: {} },
    truncate: { fn: truncate, config: { size: { type: 'Int!' } } },
    toBoolean: { fn: toBoolean, config: {} },
    removeIpZoneId: { fn: removeIpZoneId, config: {} },
    replace: { fn: replace, config: {} }
};

export function toBoolean(input: string) {
    return ts.toBoolean(input);
}

export function uppercase(input: string) {
    if (ts.isString(input)) return input.toUpperCase();
    return null;
}

export function truncate(input: string, args: ts.AnyObject) {
    const { size } = args;
    // should we be throwing
    if (!size || !ts.isNumber(size) || size <= 0) throw new Error('Invalid size paramter for truncate');
    if (ts.isString(input)) return input.slice(0, size);
    return null;
}

export function removeIpZoneId(input: string): string {
    // removes the zone id from ipv6 addresses
    // fe80:3438:7667:5c77:ce27%18 -> fe80:3438:7667:5c77:ce27
    if (input.indexOf('%') > -1) {
        return input.slice(0, input.indexOf('%'));
    }

    return input;
}

export function replace(input: string, args: { searchValue: string, replaceValue: string, global?: boolean, ignoreCase?: boolean }): string {
    // special regex chars like *, ., [] must be escaped by user inorder to be taken literally
    const {
        searchValue,
        replaceValue,
        global,
        ignoreCase
    } = args;

    let ops = '';

    if (args.global) ops += 'g';
    if (args.ignoreCase) ops += 'i';   

    try {
        const re = new RegExp(searchValue, ops);
        return input.replace(re, replaceValue);
    } catch (e) {
        throw new Error(e.message);
    }
}

export function toUnixTime(input: any): number {
    if (!valid.isTimestamp(input)) {
        throw new Error('Not a valid date, cannot transform to unix time');
    }

    if (valid.isString(input) && isNaN(input)) {
        console.log(new Date(input));
        return Date.parse(input);
    }

    if (_.isDate(input)) {
        return input.getTime();
    }

    if (`${input}`.length === 10) return Number(input) * 1000;

    return Number(input);
}


import _ from 'lodash';
import PhoneNumber from 'awesome-phonenumber';
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

    let unixTime = isNaN(input) ? Date.parse(input) : Number(input);

    if (`${unixTime}`.length === 10) unixTime *= 1000;

    return unixTime;
}

export function phoneNumber(input: string): string {
    // leading zeros break awesome phone number
    let testNumber = _.trimStart(String(input).trim(), '0');

    // needs to start with a +
    if (testNumber.indexOf('+') !== 0) testNumber = `+${testNumber}`;

    const phoneNumber = new PhoneNumber(testNumber);

    if (!phoneNumber.getNumber()) {
        throw new Error('Could not determine the incoming phone number');
    }

    return String(phoneNumber.getNumber()).slice(1);
}

export function toUUID(input: string, args?: { lowercase: boolean }): string {
    // uuid should be in format of 8-4-4-4-12, 32 hexidecimal chars
    let allAlpha = `${input}`.replace(/\W/g, '');

    const hexidecimalChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];

    if (allAlpha.length !== 32
        || allAlpha.split('').some((char: string | number) => !hexidecimalChars.includes(String(char).toLowerCase()))) {
        throw new Error('Cannot create a valid UUID number');
    }

    if (args && args.lowercase) allAlpha = allAlpha.toLowerCase();

    return `${allAlpha.slice(0, 8)}-${allAlpha.slice(8, 12)}`
        + `-${allAlpha.slice(12, 16)}-${allAlpha.slice(16, 20)}-${allAlpha.slice(20,)}`;
}

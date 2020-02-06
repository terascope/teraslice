import * as ts from '@terascope/utils';
import crypto from 'crypto';
import PhoneValidator from 'awesome-phonenumber';
import jexl from 'jexl';
import { getUnixTime } from 'date-fns';
import {
    ExtractFieldConfig, MacAddressConfig, ReplaceLiteralConfig, ReplaceRegexConfig
} from './interfaces';
import { parseGeoPoint } from './helpers';
import {
    isString, isMacAddress, isUUID, isDateLike
} from '../validations/field-validator';
import { Repository } from '../interfaces';

export const respoitory: Repository = {
    normalizeMacAddress: {
        fn: normalizeMacAddress,
        config: {
            casing: { type: 'uppercase | lowercase' },
            removeGroups: { type: 'boolean' }
        }
    },
    removeIpZoneId: { fn: removeIpZoneId, config: {} },
    replaceLiteral: { fn: replaceLiteral, config: { search: { type: 'String!' }, replace: { type: 'String!' } } },
    replaceRegex: {
        fn: replaceRegex,
        config: {
            regex: { type: 'String!' }, replace: { type: 'String!' }, global: { type: 'Boolean!' }, ignore_case: { type: 'Boolean!' }
        }
    },
    truncate: { fn: truncate, config: { size: { type: 'Int!' } } },
    toBoolean: { fn: toBoolean, config: {} },
    toISDN: { fn: toISDN, config: {} },
    toLowerCase: { fn: toLowerCase, config: {} },
    toNumber: { fn: toNumber, config: { booleanLike: { type: 'boolean' } } },
    toUpperCase: { fn: toUpperCase, config: {} },
    trim: { fn: trim, config: {} },
};

export function toBoolean(input: any) {
    return ts.toBoolean(input);
}

export function toUpperCase(input: string) {
    if (!isString(input)) throw new Error('Input must be a string');
    return input.toUpperCase();
}

export function toLowerCase(input: string) {
    if (!isString(input)) throw new Error('Input must be a string');
    return input.toLowerCase();
}

export function trim(input: string) {
    if (!isString(input)) throw new Error('Input must be a string');
    return ts.trim(input);
}
// TODO: fix types here
export function truncate(input: string, args: { size: number }) {
    if (!isString(input)) throw new Error('Input must be a string');

    const { size } = args;
    // should we be throwing
    if (!size || !ts.isNumber(size) || size <= 0) throw new Error('Invalid size paramter for truncate');
    return input.slice(0, size);
}

export function toISDN(input: any) {
    let testNumber = ts.toString(input).trim();
    if (testNumber.charAt(0) === '0') testNumber = testNumber.slice(1);

    // needs to start with a +
    if (testNumber.charAt(0) !== '+') testNumber = `+${testNumber}`;

    const fullNumber = new PhoneValidator(testNumber).getNumber();
    if (fullNumber) return String(fullNumber).slice(1);

    throw Error('Could not determine the incoming phone number');
}

// probably not needed, can distill this down to remove delimiter and lowercase or uppercase
export function normalizeMacAddress(input: any, args?: MacAddressConfig) {
    let results = input;

    if (!ts.isString(input) || !isMacAddress(input)) {
        throw new Error('Not a valid mac address');
    }

    if (args) {
        if (args.casing === 'lowercase') results = results.toLowerCase();
        if (args.casing === 'uppercase') results = results.toUpperCase();
        if (args.removeGroups) results = results.replace(/:|\.|-|\s/g, '');
    }

    return results;
}

export function toNumber(input: any, args?: { booleanLike?: boolean }) {
    let result = input;

    if (args && args.booleanLike && ts.isBooleanLike(input)) {
        result = ts.toNumber(toBoolean(result));
    }

    result = ts.toNumber(result);

    if (isNaN(result)) throw new Error('could not convert to a number');
    return result;
}

export function decodeBase64(input: string) {
    if (!isString(input)) throw new Error('Input must be a string');
    return Buffer.from(input, 'base64').toString('utf8');
}

export function encodeBase64(input: string) {
    if (!isString(input)) throw new Error('Input must be a string');
    return Buffer.from(input).toString('base64');
}

export function decodeUrl(input: string) {
    if (!isString(input)) throw new Error('Input must be a string');
    return decodeURIComponent(input);
}

export function encodeUrl(input: string) {
    if (!isString(input)) throw new Error('Input must be a string');
    return encodeURIComponent(input);
}

export function decodeHex(input: string) {
    if (!isString(input)) throw new Error('Input must be a string');
    return Buffer.from(input, 'hex').toString('utf8');
}

export function encodeHex(input: string) {
    if (!isString(input)) throw new Error('Input must be a string');
    return Buffer.from(input).toString('hex');
}

export function encodeMD5(input: string) {
    if (!isString(input)) throw new Error('Input must be a string');
    return crypto.createHash('md5').update(input).digest('hex');
}

// TODO: better types for this
export function encodeSHA(input: any, { hash = 'sha256', digest = 'hex' }) {
    if (!isString(input)) throw new Error('Input must be a string');
    // TODO: guard for hash ??
    if (!['latin1', 'hex', 'base64'].includes(digest)) throw new Error('Parameter digest is misconfigured');
    // @ts-ignore
    return crypto.createHash(hash).update(input).digest(digest);
}

export function encodeSHA1(input: string) {
    if (!isString(input)) throw new Error('Input must be a string');
    return crypto.createHash('sha1').update(input).digest('hex');
}

export function decodeSHA1(input: string) {
    if (!isString(input)) throw new Error('Input must be a string');
    return crypto.createHash('sha1').update(input).digest('hex');
}

export function parseJSON(input: any) {
    if (!isString(input)) throw new Error('Input must be a string');
    return JSON.parse(input);
}

export function dedup(input: any[]) {
    if (!Array.isArray(input)) throw new Error('Input must be an array');
    return ts.uniq(input);
}

export function toGeoPoint(input: any) {
    return parseGeoPoint(input, true);
}

export function extract(
    input: any,
    {
        regex, isMultiValue = true, jexlExp, start, end
    }: ExtractFieldConfig
) {
    function getSubslice() {
        const indexStart = input.indexOf(start);
        if (indexStart !== -1) {
            const sliceStart = indexStart + start.length;
            let endInd = input.indexOf(end, sliceStart);
            if (endInd === -1) endInd = input.length;
            const extractedSlice = input.slice(sliceStart, endInd);
            if (extractedSlice) return input.slice(sliceStart, endInd);
        }
        return null;
    }

    type Cb = (data: any) => string|string[]|null;

    function extractField(data: any, fn: Cb) {
        if (typeof data === 'string') {
            return fn(data);
        }

        if (Array.isArray(data)) {
            const results: string[] = [];

            data.forEach((subData: any) => {
                if (typeof subData === 'string') {
                    const extractedSlice = fn(subData);
                    if (extractedSlice) {
                        if (Array.isArray(extractedSlice)) {
                            results.push(...extractedSlice);
                        } else {
                            results.push(extractedSlice);
                        }
                    }
                }
            });

            if (results.length > 0) {
                if (isMultiValue) return results;
                return results[0];
            }
        }

        return null;
    }

    function matchRegex() {
        const results = ts.matchAll(regex as string, input);
        if (isMultiValue) return results;
        return results ? results[0] : results;
    }

    function callExpression() {
        try {
            return jexl.evalSync(jexlExp as string, input);
        } catch (err) {
            const errMessage = `Invalid jexl expression: ${jexlExp}, error: ${err.message}`;
            throw new ts.TSError(errMessage);
        }
    }

    function extractAndTransferFields() {
        let extractedResult;

        if (regex) {
            extractedResult = extractField(input, matchRegex);
        } else if (start && end) {
            extractedResult = extractField(input, getSubslice);
        } else if (jexlExp) {
            extractedResult = callExpression();
        } else {
            extractedResult = input;
        }
        return extractedResult;
    }

    const results = extractAndTransferFields();
    if (!results) throw new Error('Was not able to extract anything');
}

// distill down to trim after char
export function removeIpZoneId(input: string): string {
    // removes the zone id from ipv6 addresses
    // fe80:3438:7667:5c77:ce27%18 -> fe80:3438:7667:5c77:ce27
    if (input.indexOf('%') > -1) {
        return input.slice(0, input.indexOf('%'));
    }

    return input;
}

export function replaceRegex(input: string, {
    regex, replace, ignoreCase, global
}: ReplaceRegexConfig): string {
    let options = '';

    if (ignoreCase) options += 'i';
    if (global) options += 'g';

    try {
        const re = new RegExp(regex, options);
        return input.replace(re, replace);
    } catch (e) {
        throw new Error(e.message);
    }
}

export function replaceLiteral(input: string, { search, replace }: ReplaceLiteralConfig): string {
    try {
        return input.replace(search, replace);
    } catch (e) {
        throw new Error(`Could not replace ${search} with ${replace}`);
    }
}

// option to specify, seconds, millisecond, microseconds?
export function toUnixTime(input: any): number {
    if (!isDateLike(input)) {
        throw new Error('Not a valid date, cannot transform to unix time');
    }

    const parse = isNaN(input) ? Date.parse(input) : Number(input);

    const unixTime = getUnixTime(parse);

    if (String(unixTime) === 'NaN') {
        throw new Error('Not a valid date, cannot transform to unix time');
    }

    return unixTime;
}

// unix timestamp to date object
export function fromUnixTime(input: number) {

}

export function toISO8601(input: any): string {
    // convert timestamps, date objects other formats to iso8601

    /*
    if (!isTimestamp(input)) {
        throw new Error('Not a valid date');
    }
    */

    return new Date(input).toISOString();
}

// format/ noramlize UUID? option to choose delimiter
export function toUUID(input: string, args?: { lowercase: boolean }): string {
    // uuid should be in format of 8-4-4-4-12, 32 hexidecimal chars
    let allAlpha = `${input}`.replace(/\W/g, '');

    if (!isUUID(allAlpha)) {
        throw new Error('Cannot create a valid UUID number');
    }

    if (args && args.lowercase) allAlpha = allAlpha.toLowerCase();

    return `${allAlpha.slice(0, 8)}-${allAlpha.slice(8, 12)}`
        + `-${allAlpha.slice(12, 16)}-${allAlpha.slice(16, 20)}-${allAlpha.slice(20,)}`;
}

import * as ts from '@terascope/utils';
import crypto from 'crypto';
import PhoneValidator from 'awesome-phonenumber';
import jexl from 'jexl';
import { ExtractFieldConfig } from './interfaces';
import { parseGeoPoint } from './helpers';
import { isString } from '../validations/field-validator';
import { Repository } from '../interfaces';

export const respoitory: Repository = {
    uppercase: { fn: toUpperCase, config: {} },
    truncate: { fn: truncate, config: { size: { type: 'Int!' } } },
    toBoolean: { fn: toBoolean, config: {} },
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
export function truncate(input: string, args: ts.AnyObject) {
    if (!isString(input)) throw new Error('Input must be a string');

    const { size } = args;
    // should we be throwing
    if (!size || !ts.isNumber(size) || size <= 0) throw new Error('Invalid size paramter for truncate');
    return input.slice(0, size);
}

// TODO: could this have a number input?
export function toISDN(input: string) {
    const phoneNumber = new PhoneValidator(`+${input}`);
    const fullNumber = phoneNumber.getNumber();
    if (fullNumber) return String(fullNumber).slice(1);
    throw Error('could not genereate ISDN');
}
type Case = 'lowercase' | 'uppercase';

// export function normalizeMacAddress(
//     input: any,
//     case = 'lowercase',
//     preserveColons = false,
// ){
//     if (!isString(input)) throw new Error('Input must be a string')

//     let results = input;
//         if (typeof input !== 'string') throw new Error('data must be a string');
//         if (case === 'lowercase') results = results.toLowerCase();
//         if (case === 'uppercase') results = results.toUpperCase();
//         if (!preserveColons) results = results.replace(/:/gi, '');
//         return results;
// }

export function normalizeNumber(input: any) {
    if (typeof input === 'number') return input;
    if (typeof input === 'string') {
        const results = ts.toNumber(input);
        if (Number.isNaN(results)) throw new Error('could not convert to a number');
        return results;
    }
    throw new Error('could not convert to a number');
}

export function toNumber(input: any) {
    // TODO: does this check for isNAN
    if (ts.isNumber(input)) return ts.toNumber(input);
    throw new Error('Input could not convert to a number');
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

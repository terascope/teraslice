import * as ts from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import crypto from 'node:crypto';
import { parsePhoneNumber as _parsePhoneNumber } from 'awesome-phonenumber';
import { format as dateFormat, parse } from 'date-fns';
import { ReplaceLiteralConfig, ReplaceRegexConfig, ExtractFieldConfig } from './interfaces.js';
import {
    isString,
    isValidDate,
    isNumber,
    isArray,
    isNumberTuple
} from '../validations/field-validator.js';
import { Repository, InputType } from '../interfaces.js';

export const repository: Repository = {
    toString: {
        fn: toString,
        config: {},
        output_type: FieldType.String,
        primary_input_type: InputType.String
    },
    toBoolean: {
        fn: toBoolean,
        config: {},
        output_type: FieldType.Boolean,
        primary_input_type: InputType.Any
    },
    toUpperCase: {
        fn: toUpperCase,
        config: {},
        output_type: FieldType.String,
        primary_input_type: InputType.String
    },
    toLowerCase: {
        fn: toLowerCase,
        config: {},
        output_type: FieldType.String,
        primary_input_type: InputType.String
    },
    trim: {
        fn: trim,
        config: {
            char: { type: FieldType.String }
        },
        output_type: FieldType.String,
        primary_input_type: InputType.String
    },
    truncate: {
        fn: truncate,
        config: {
            size: { type: FieldType.Number }
        },
        output_type: FieldType.String,
        primary_input_type: InputType.String
    },
    toISDN: {
        fn: toISDN,
        config: {},
        output_type: FieldType.String,
        primary_input_type: InputType.String
    },
    toNumber: {
        fn: toNumber,
        config: {
            booleanLike: { type: FieldType.Boolean }
        },
        output_type: FieldType.Number,
        primary_input_type: InputType.String
    },
    decodeBase64: {
        fn: decodeBase64,
        config: {},
        output_type: FieldType.String,
        primary_input_type: InputType.String
    },
    encodeBase64: {
        fn: encodeBase64,
        config: {},
        output_type: FieldType.String,
        primary_input_type: InputType.String
    },
    decodeURL: {
        fn: decodeURL,
        config: {},
        output_type: FieldType.String,
        primary_input_type: InputType.String
    },
    encodeURL: {
        fn: encodeURL,
        config: {},
        output_type: FieldType.String,
        primary_input_type: InputType.String
    },
    decodeHex: {
        fn: decodeHex,
        config: {},
        output_type: FieldType.String,
        primary_input_type: InputType.String
    },
    encodeHex: {
        fn: encodeHex,
        config: {},
        output_type: FieldType.String,
        primary_input_type: InputType.String
    },
    encodeMD5: {
        fn: encodeMD5,
        config: {},
        output_type: FieldType.String,
        primary_input_type: InputType.String
    },
    encodeSHA: {
        fn: encodeSHA,
        config: {
            hash: { type: FieldType.String },
            digest: { type: FieldType.String }
        },
        output_type: FieldType.String,
        primary_input_type: InputType.String
    },
    encodeSHA1: {
        fn: encodeSHA1,
        config: {},
        output_type: FieldType.String,
        primary_input_type: InputType.String
    },
    parseJSON: {
        fn: parseJSON,
        config: {},
        output_type: FieldType.Any,
        primary_input_type: InputType.String
    },
    toJSON: {
        fn: toJSON,
        config: {
            pretty: { type: FieldType.Boolean }
        },
        output_type: FieldType.String,
        primary_input_type: InputType.Any
    },
    toGeoPoint: {
        fn: toGeoPoint,
        config: {},
        output_type: FieldType.GeoPoint,
        primary_input_type: InputType.String
    },
    // this will be overridden
    extract: {
        fn: extract,
        config: {
            regex: { type: FieldType.String },
            isMultiValue: { type: FieldType.Boolean },
            jexlExp: { type: FieldType.String },
            start: { type: FieldType.String },
            end: { type: FieldType.String }
        },
        output_type: FieldType.Any,
        primary_input_type: InputType.String
    },
    replaceRegex: {
        fn: replaceRegex,
        config: {
            regex: { type: FieldType.String },
            replace: { type: FieldType.String },
            global: { type: FieldType.String },
            ignore_case: { type: FieldType.Boolean }
        },
        output_type: FieldType.String,
        primary_input_type: InputType.String
    },
    replaceLiteral: {
        fn: replaceLiteral,
        config: {
            search: {
                type: FieldType.String
            },
            replace: {
                type: FieldType.String
            }
        },
        output_type: FieldType.String,
        primary_input_type: InputType.String
    },
    toUnixTime: {
        fn: toUnixTime,
        config: {},
        output_type: FieldType.Number,
        primary_input_type: InputType.String
    },
    toISO8601: {
        fn: toISO8601,
        config: {
            resolution: {
                type: FieldType.String,
                description: 'may be set to seconds | milliseconds'
            }
        },
        output_type: FieldType.String,
        primary_input_type: InputType.String
    },
    formatDate: {
        fn: formatDate,
        config: {
            format: { type: FieldType.String },
            resolution: { type: FieldType.String, description: 'may be set to seconds | milliseconds' },
        },
        output_type: FieldType.String,
        primary_input_type: InputType.String
    },
    parseDate: {
        fn: parseDate,
        config: {
            format: { type: FieldType.String },
        },
        output_type: FieldType.Date,
        primary_input_type: InputType.String
    },
    trimStart: {
        fn: trimStart,
        config: {
            char: { type: FieldType.String }
        },
        output_type: FieldType.String,
        primary_input_type: InputType.String
    },
    trimEnd: {
        fn: trimEnd,
        config: {
            char: { type: FieldType.String }
        },
        output_type: FieldType.String,
        primary_input_type: InputType.String
    },
    toCamelCase: {
        fn: toCamelCase,
        config: {},
        output_type: FieldType.String,
        primary_input_type: InputType.String
    },
    toKebabCase: {
        fn: toKebabCase,
        config: {},
        output_type: FieldType.String,
        primary_input_type: InputType.String
    },
    toPascalCase: {
        fn: toPascalCase,
        config: {},
        output_type: FieldType.String,
        primary_input_type: InputType.String
    },
    toSnakeCase: {
        fn: toSnakeCase,
        config: {},
        output_type: FieldType.String,
        primary_input_type: InputType.String
    },
    toTitleCase: {
        fn: toTitleCase,
        config: {},
        output_type: FieldType.String,
        primary_input_type: InputType.String
    },
    setField: {
        fn: setField,
        config: {
            value: {
                type: FieldType.Any
            }
        },
        output_type: FieldType.Any,
        primary_input_type: InputType.String
    },
    setDefault: {
        fn: setDefault,
        config: {
            value: {
                type: FieldType.Any
            }
        },
        output_type: FieldType.Any,
        primary_input_type: InputType.String
    },
    map: {
        fn: map,
        config: {
            fn: {
                type: FieldType.String
            },
            options: {
                type: FieldType.Object
            }
        },
        output_type: FieldType.Any,
        primary_input_type: InputType.Array
    },
    splitString: {
        fn: splitString,
        config: {},
        output_type: FieldType.String,
        primary_input_type: InputType.String
    }
};

type StringInput = string | string[] | null | undefined;

/**
 * This function is used to set a value if input is null or undefined,
 * otherwise the input value is returned
 *
 * @example
 *
 * const results = FieldTransform.setDefault(undefined, {}, { value: 'someValue' });
 * results === 'someValue';
 *
 * @param {*} input
 * @param {{ value: any }} args value is what will be given when input is null/undefined
 * @returns {*}
 */

export function setDefault(input: unknown, _parentContext: unknown, args: { value: any }): any {
    if (ts.isNil(input)) {
        if (ts.isNil(args.value)) throw new Error('Parameter value cannot be set to undefined or null');
        return args.value;
    }
    return input;
}

/**
 * This function is used to map an array of values with any FieldTransform method
 *
 * @example
 *
 *  const array = ['hello', 'world', 'goodbye'];
 *  const results = FieldTransform.map(array, array, { fn: 'truncate', options: { size: 3 } }
 *  results === ['hel', 'wor', 'goo']
 *
 * @param  {any[]} input an array of any value
 * @param  {{fn:string; options?:any}} args fn any FieldTransform function name,
 * options is an object with any additional parameters needed
 * @returns {any[] | null} returns the mapped values, return null if input is null/undefined
 */

export function map(
    input: any[], parentContext: any[], args: { fn: string; options?: any }
): any[] | null {
    if (ts.isNil(input)) return null;

    if (!isArray(input)) throw new Error(`Input must be an array, received ${ts.getTypeOf(input)}`);
    const { fn, options } = args;
    const repoConfig = repository[fn];
    if (!repoConfig) throw new Error(`No function ${fn} was found in the field transform repository`);

    return input.map((data) => repoConfig.fn(data, parentContext, options));
}

// TODO: this is currently a hack for directives, this will evolve, do not use it for other purposes

/**
 * This function is not meant to be used programmatically
 * please use `RecordTransform.setField` instead
 *
 * @param {*} _input This value will be discarded
 * @param {{ value: any }} args value will be used to set field
 * @returns
 */

export function setField(_input: unknown, _parentContext: unknown, args: { value: any }): any {
    const { value } = args;
    return value;
}

/**
 * Converts values to strings
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @example
 *
 * FieldTransform.toString(true); // 'true';
 * FieldTransform.toString([true, undefined, false]); // ['true', 'false'];
 *
 * @param {*} input
 * @returns {String | null} returns null if input is null/undefined
 */

export function toString(input: unknown, _parentContext?: unknown): string | string[] | null {
    if (ts.isNil(input)) return null;
    if (isArray(input)) return input.filter(ts.isNotNil).map(ts.toString);

    return ts.toString(input);
}

/**
 * Converts values to booleans
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @example
 *
 * FieldTransform.toBoolean('0'); // false
 * FieldTransform.toBoolean(['foo', 'false', null]); // [true, false];
 *
 * @param {*} input
 * @returns {Boolean | null} returns null if input is null/undefined
 */

export function toBoolean(input: unknown, _parentContext?: unknown): boolean | boolean[] | null {
    if (ts.isNil(input)) return null;
    if (isArray(input)) return input.filter(ts.isNotNil).map(ts.toBoolean);

    return ts.toBoolean(input);
}

/**
 * Converts strings to UpperCase
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @example
 *
 *  FieldTransform.toUpperCase('lowercase'); // 'LOWERCASE';
 *  FieldTransform.toUpperCase(['MixEd', null, 'lower']); // ['MIXED', 'LOWER'];
 *
 * @param {StringInput} input string or string[]
 * @returns { String | String[] | null } returns null if input is null/undefined
 */

export function toUpperCase(
    input: StringInput,
    _parentContext?: unknown
): string | string[] | null {
    if (ts.isNil(input)) return null;
    if (isArray(input)) return input.filter(ts.isNotNil).map((str: string) => str.toUpperCase());
    if (!isString(input)) throw new Error(`Input must be a string, or an array of string, received ${ts.getTypeOf(input)}`);

    return input.toUpperCase();
}

/**
 * Converts strings to lowercase
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @example
 *
 *  FieldTransform.toLowerCase('UPPERCASE'); // 'uppercase';
 *  FieldTransform.toLowerCase(['MixEd', null, 'UPPER']); // ['mixed', 'upper'];
 *
 * @param {StringInput} input string | string[]
 * @returns { String | String[] | null } returns null if input is null/undefined
 */

export function toLowerCase(
    input: StringInput,
    _parentContext?: unknown
): string | string[] | null {
    if (ts.isNil(input)) return null;
    if (isArray(input)) return input.filter(ts.isNotNil).map((str: string) => str.toLowerCase());
    if (!isString(input)) throw new Error(`Input must be a string, or an array of string, received ${ts.getTypeOf(input)}`);

    return input.toLowerCase();
}

/**
 * Will trim the input
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @example
 *
 * FieldTransform.trim('right    '); // 'right';
 * FieldTransform.trim('fast cars race fast', {}, { char: 'fast' }); // ' cars race ';
 * FieldTransform.trim('   string    ')).toBe('string');
 * FieldTransform.trim('   left')).toBe('left');
 * FieldTransform.trim('.*.*a regex test.*.*.*.* stuff', {}, { char: '.*' }); // 'a regex test'
 * FieldTransform.trim('\t\r\rtrim this\r\r', {}, { char: '\r' }); // 'trim this'
 * FieldTransform.trim('        '); // ''
 * FieldTransform.trim(['right    ', '   left']); // ['right', 'left'];
 *
 * @param {StringInput} input string | string[]
 * @param {{ char: string }} [args] a single char or word that will be cut out
 * @returns { String | String[] | null } returns null if input is null/undefined
 */

export function trim(
    input: StringInput, parentContext?: unknown, args?: { char: string }
): string | string[] | null {
    if (ts.isNil(input)) return null;
    const char: string = (args?.char && isString(args.char)) ? args.char : ' ';

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((str: string) => ts.trim(str, char));
    }

    return ts.trim(input, char);
}

/**
 * Will trim the beginning of the input
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @example
 *
 * const config = { char: 'i' };
 * FieldTransform.trimStart('    Hello Bob    '); // 'Hello Bob    ';
 * FieldTransform.trimStart('iiii-wordiwords-iii', {}, config); // '-wordiwords-iii';
 * FieldTransform.trimStart(['    Hello Bob    ', 'right    ']); // ['Hello Bob    ', 'right    '];
 *
 * @param {StringInput} input string | string[]
 * @param {{ char: string }} [args]
 * @returns { String | String[] | null } returns null if input is null/undefined
 */

export function trimStart(
    input: StringInput, _parentContext?: unknown, args?: { char: string }
): string | string[] | null {
    if (ts.isNil(input)) return null;
    if (args?.char && !isString(args.char)) throw new Error(`Parameter char must be a string, received ${ts.getTypeOf(input)}`);

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((str: any) => ts.trimStart(str, args?.char));
    }

    if (!isString(input)) throw new Error(`Input must be a string, or an array of string, received ${ts.getTypeOf(input)}`);

    return ts.trimStart(input, args?.char);
}

/**
 * Will trim the end of the input
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @example
 *
 * FieldTransform.trimEnd('    Hello Bob    '); // '    Hello Bob';
 * FieldTransform.trimEnd('iiii-wordiwords-iii', {}, { char: 'i' }); // 'iiii-wordiwords';
 * FieldTransform.trimEnd(['    Hello Bob    ', 'right    ']); // ['    Hello Bob', 'right'];
 *
 * @param {StringInput} input string | string[]
 * @param {{ char: string }} [args]
 * @returns { String | String[] | null } returns null if input is null/undefined
 */

export function trimEnd(
    input: StringInput, _parentContext?: unknown, args?: { char: string }
): string | string[] | null {
    if (ts.isNil(input)) return null;
    if (args?.char && !isString(args.char)) throw new Error(`Parameter char must be a string, received ${ts.getTypeOf(input)}`);

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((str: any) => ts.trimEnd(str, args?.char));
    }

    if (!isString(input)) throw new Error(`Input must be a string, or an array of string, received ${ts.getTypeOf(input)}`);

    return ts.trimEnd(input, args?.char);
}

/**
 * Will truncate the input to the length of the size given
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @example
 *
 * FieldTransform.truncate('thisisalongstring', {}, { size: 4 }); // 'this';
 * FieldTransform.truncate(['hello', null, 'world'], {}, { size: 2 }); // ['he', 'wo'];
 *
 * @param {StringInput} input string | string[]
 * @param {{ size: number }} args
 * @returns { String | String[] | null } returns null if input is null/undefined
 */

export function truncate(
    input: StringInput, _parentContext: unknown, args: { size: number }
): string | string[] | null {
    const { size } = args;

    if (ts.isNil(input)) return null;
    if (!size || !ts.isNumber(size) || size <= 0) throw new Error('Invalid size paramter for truncate');

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((str: any) => str.slice(0, size));
    }

    if (!isString(input)) throw new Error(`Input must be a string, or an array of string, received ${ts.getTypeOf(input)}`);

    return input.slice(0, size);
}

function parsePhoneNumber(str: any) {
    let testNumber = ts.toString(str).trim();
    if (testNumber.charAt(0) === '0') testNumber = testNumber.slice(1);

    // needs to start with a +
    if (testNumber.charAt(0) !== '+') testNumber = `+${testNumber}`;

    const fullNumber = _parsePhoneNumber(testNumber).number?.e164;
    if (fullNumber) return String(fullNumber).slice(1);

    throw Error('Could not determine the incoming phone number');
}

/**
 * Parses a string or number to a fully validated phone number
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @example
 *
 * FieldTransform.toISDN('+33-1-22-33-44-55'); // '33122334455';
 * FieldTransform.toISDN('1(800)FloWErs'); // '18003569377';
 * FieldTransform.toISDN(['1(800)FloWErs','+33-1-22-33-44-55' ]); // ['18003569377', '33122334455'];
 *
 * @param {*} input string | string[] | number | number[]
 * @returns { String | String[] | null }  a fully validated phone number,
 * returns null if input is null/undefined
 */

export function toISDN(input: unknown, _parentContext?: unknown): string | string[] | null {
    if (ts.isNil(input)) return null;
    if (isArray(input)) return input.filter(ts.isNotNil).map(parsePhoneNumber);

    return parsePhoneNumber(input);
}

function convertToNumber(input: any, args?: { booleanLike?: boolean }) {
    let result = input;

    if (args?.booleanLike === true && ts.isBooleanLike(input)) {
        result = ts.toNumber(toBoolean(result));
    }

    result = ts.toNumber(result);

    if (Number.isNaN(result)) throw new Error(`Could not convert input of type ${ts.getTypeOf(input)} to a number`);
    return result;
}

/**
 * Converts a value to a number if possible
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @example
 *
 * FieldTransform.toNumber('12321'); // 12321;
 * FieldTransform.toNumber('000011'); // 11;
 * FieldTransform.toNumber('true', {}, { booleanLike: true }); // 1;
 * FieldTransform.toNumber(null, {}, { booleanLike: true }); // 0;
 * FieldTransform.toNumber(null); // null;
 * FieldTransform.toNumber(['000011', '12321']); // [11, 12321];
 *
 * @param {*} input
 * @param {{ booleanLike?: boolean }} [args]
 * @returns { number | null } returns null if input is null/undefined
 */

export function toNumber(
    input: unknown, _parentContext?: unknown, args?: { booleanLike?: boolean }
): number | number[] | null {
    if (ts.isNil(input) && args?.booleanLike !== true) return null;

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((data: any) => convertToNumber(data, args));
    }

    return convertToNumber(input, args);
}

/**
 * decodes a base64 encoded value
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @example
 *
 * const str = 'hello world';
 * const encoded = encodeBase64(str);
 *
 * const results = FieldTransform.decodeBase64(encoded)
 * results === str
 *
 *  FieldTransform.decodeBase64([encoded]) === [str]
 *
 * @param {*} input
 * @returns { string | null } returns null if input is null/undefined
 */

export function decodeBase64(input: unknown, _parentContext?: unknown): string | string[] | null {
    if (ts.isNil(input)) return null;

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((data: any) => Buffer.from(data, 'base64').toString('utf8'));
    }

    return Buffer.from(input as string, 'base64').toString('utf8');
}

/**
 * converts a value into a base64 encoded value
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @example
 *
 * const str = 'hello world';
 *
 * const encodedValue = FieldTransform.encodeBase64(str);
 * const arrayOfEncodedValues = FieldTransform.encodeBase64([str]);
 *
 * @param {*} input
 * @returns { string | null } returns null if input is null/undefined
 */

export function encodeBase64(input: unknown, _parentContext?: unknown): string | string[] | null {
    if (ts.isNil(input)) return null;

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((data: any) => Buffer.from(data).toString('base64'));
    }

    return Buffer.from(input as any).toString('base64');
}

/**
 * decodes a URL encoded value
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @example
 *
 * const source = 'HELLO AND GOODBYE';
 * const encoded = 'HELLO%20AND%20GOODBYE';
 *
 * FieldTransform.decodeURL(encoded); // source;
 * FieldTransform.decodeURL([encoded]); //[source];
 *
 * @param {StringInput} input
 * @returns { string | null } returns null if input is null/undefined
 */

export function decodeURL(input: StringInput, _parentContext?: unknown): string | string[] | null {
    if (ts.isNil(input)) return null;

    if (isArray(input)) return input.filter(ts.isNotNil).map(decodeURIComponent);
    if (!isString(input)) throw new Error(`Input must be a string, or an array of string, received ${ts.getTypeOf(input)}`);

    return decodeURIComponent(input);
}

/**
 * URL encodes a value
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @example
 *
 * const source = 'HELLO AND GOODBYE';
 * const encoded = 'HELLO%20AND%20GOODBYE';
 *
 * FieldTransform.encodeURL(source); // encoded;
 * const arrayOfEncodedValues = FieldTransform.encodeURL([source]);
 *
 * @param {StringInput} input
 * @returns { string | null } returns null if input is null/undefined
 */

export function encodeURL(input: StringInput, _parentContext?: unknown): string | string[] | null {
    if (ts.isNil(input)) return null;

    if (isArray(input)) return input.filter(ts.isNotNil).map(encodeURIComponent);
    if (!isString(input)) throw new Error(`Input must be a string, or an array of string, received ${ts.getTypeOf(input)}`);

    return encodeURIComponent(input);
}

/**
 * decodes the hex encoded input
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @example
 *
 * const source = 'hello world';
 * const encoded = encodeHex(source);
 *
 * FieldTransform.decodeHex(encoded); // source;
 * FieldTransform.decodeHex([encoded]); // [source];
 *
 * @param {*} input
 * @returns { string | null } returns null if input is null/undefined
 */

export function decodeHex(input: unknown, _parentContext?: unknown): string | string[] | null {
    if (ts.isNil(input)) return null;

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((data: any) => Buffer.from(data, 'hex').toString('utf8'));
    }

    return Buffer.from(input as string, 'hex').toString('utf8');
}

/**
 * hex encodes the input
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @example
 *
 * const source = 'hello world';
 *
 * FieldTransform.encodeHex(source);
 * const arrayOfEncodedValues = FieldTransform.encodeHex([source]);
 *
 * @param {*} input
 * @returns { string | null } returns null if input is null/undefined
 */

export function encodeHex(input: unknown, _parentContext?: unknown): string | string[] | null {
    if (ts.isNil(input)) return null;

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((data: any) => Buffer.from(data).toString('hex'));
    }

    return Buffer.from(input as string).toString('hex');
}

/**
 * MD5 encodes the input
 * if given an array it will convert everything in the array excluding null/undefined values
 * @example
 * const source = 'hello world';
 *
 * FieldTransform.encodeMD5(source);
 * const arrayOfEncodedValues = FieldTransform.encodeHex([source]);
 *
 * @param {*} input
 * @returns { string | null } returns null if input is null/undefined
 */

export function encodeMD5(input: unknown, _parentContext?: unknown): string | string[] | null {
    if (ts.isNil(input)) return null;

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((data: any) => crypto.createHash('md5').update(data)
                .digest('hex'));
    }

    return crypto.createHash('md5').update(input as string)
        .digest('hex');
}

/**
* SHA encodes the input to the hash specified
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @example
 *
 * const data = 'some string';
 * const config = { hash: 'sha256', digest: 'hex'};
 * fieldTransform.encodeSHA(data , {}, config)
 * const arrayOfEncodedValues = FieldTransform.encodeSHA([source], {}, config);
 *
 * @param {*} input
 * @param {*} [{ hash = 'sha256', digest = 'hex' }={}]
 *  possible digest values ['ascii', 'utf8', 'utf16le', 'ucs2', 'base64', 'latin1', 'hex', 'binary']
 *  possible hash values
 * @returns { string | null } returns null if input is null/undefined
 */

export function encodeSHA(
    input: unknown, _parentContext?: unknown, { hash = 'sha256', digest = 'hex' } = {}
): string | string[] | null {
    if (ts.isNil(input)) return null;

    if (!['ascii', 'utf8', 'utf16le', 'ucs2', 'base64', 'latin1', 'hex', 'binary'].includes(digest)) {
        throw new Error('Parameter digest is misconfigured');
    }

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((data: any) => crypto.createHash(hash).update(data)
                .digest(digest as any));
    }

    return crypto.createHash(hash).update(input as string)
        .digest(digest as any);
}

/**
 * converts the value to a SHA1 encoded value
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @example
 *
 * const source = 'hello world';
 *
 * FieldTransform.encodeSHA1(source);
 * const arrayOfEncodedValues = FieldTransform.encodeSHA([source]);
 *
 * @param {*} input
 * @returns { string | null } returns null if input is null/undefined
 */

export function encodeSHA1(input: unknown, _parentContext?: unknown): string | string[] | null {
    if (ts.isNil(input)) return null;

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((data: any) => crypto.createHash('sha1').update(data)
                .digest('hex'));
    }

    return crypto.createHash('sha1').update(input as string)
        .digest('hex');
}

/**
 * Parses the json input
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @example
 *
 * const obj = { hello: 'world' };
 * const json = JSON.stringify(obj);
 * const results = FieldTransform.parseJSON(json);
 * results === obj
 *
 * FieldTransform.parseJSON([json]); // [obj]
 *
 * @param {*} input
 * @returns { any | null } returns null if input is null/undefined
 */

export function parseJSON(input: unknown, _parentContext?: unknown): any | null {
    if (ts.isNil(input)) return null;

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((data: any) => JSON.parse(data));
    }

    return JSON.parse(input as string);
}

/**
 * Converts input to JSON
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @example
 *
 * const obj = { hello: 'world' };
 *
 * FieldTransform.toJSON(obj); // '{"hello": "world"}'
 * FieldTransform.toJSON([obj]); // ['{"hello": "world"}']
 *
 * @param {*} input
 * @param {*} [{ pretty = false }={}] setting pretty to true will format the json output
 * @returns { string | string[] | null } returns null if input is null/undefined
 */

export function toJSON(
    input: unknown, _parentContext?: unknown, { pretty = false } = {}
): string | string[] | null {
    if (ts.isNil(input)) return null;

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((data: any) => {
                if (pretty) return JSON.stringify(data, null, 2);
                return JSON.stringify(data);
            });
    }

    if (pretty) return JSON.stringify(input, null, 2);
    return JSON.stringify(input);
}

/**
 * Converts the value into a geo-point
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @example
 *
 * fieldTransform.toGeoPoint('60, 40'); // { lon: 40, lat: 60 };
 * fieldTransform.toGeoPoint([40, 60]); // { lon: 40, lat: 60 };
 * fieldTransform.toGeoPoint({ lat: 40, lon: 60 }); // { lon: 60, lat: 40 };
 * fieldTransform.toGeoPoint({ latitude: 40, longitude: 60 }); // { lon: 60, lat: 40 }
 *
 * const results = FieldTransform.toGeoPoint(['60, 40', null, [50, 60]]);
 * results === [{ lon: 40, lat: 60 },{ lon: 50, lat: 60 }];
 *
 * @param {*} input
 * @returns {{ lat: number, lon: number } | { lat: number, lon: number }[] | null }
 * returns null if input is null/undefined
 */

export function toGeoPoint(
    input: unknown, _parentContext?: unknown
): { lat: number; lon: number } | ({ lat: number; lon: number })[] | null {
    if (ts.isNil(input)) return null;

    // a tuple of numbers is a form of geo-point, do not map it
    if (isArray(input) && !isNumberTuple(input)) {
        return input
            .filter(ts.isNotNil)
            .map((data: any) => ts.parseGeoPoint(data, true));
    }

    return ts.parseGeoPoint(input as any, true);
}

/**
 * Can extract values from a string input. You may either specify a regex, a jexl expression, or
 * specify the start and end from which the extraction will take all values between
 * if given an array it will convert everything in the array excluding null/undefined values
 *
 * @param {*} input
 * @param {ExtractFieldConfig} {
 *         regex, isMultiValue = true, jexlExp, start, end
 *     }
 *  If regex is specified, it will run the regex against the value.
 *  If isMultiValue is true, then an array containing the return results will be returned.
 *  If it is set to false, then only the first possible extraction will be returned.
 *  start/end are used as boundaries for extraction, should not be used with jexlExp or regex
 *  jexlExp is a jexl expression  => https://github.com/TomFrost/Jexl
 * @returns { string | string[] | null } returns null if input is null/undefined
 *
 * @example
 *
 *  const config = { start: '<', end: '>' }
 *  const results1 = FieldTransform.extract('<hello>', { field: '<hello>' }, config);
 *  results1; // 'hello';
 *
 * const results2 = FieldTransform.extract('bar', { foo: 'bar' }, { jexlExp: '[foo]' });
 * results2; // ['bar'];
 *
 * const results3 = FieldTransform.extract('hello',  { field: 'hello'}, { regex: 'he.*' });
 * results3; // ['hello'];
 *
 * const config2 = { regex: 'he.*', isMultiValue: false };
 * const results = FieldTransform.extract('hello',  { field: 'hello'}, config2);
 * results; // 'hello';
 *
 * const context =  { field: ['<hello>', '<world>'] };
 * const results = FieldTransform.extract(['<hello>', '<world>'], context, config);
 * results; // ['hello', 'world'];
 */

// this will be overritten by extract in jexl folder
export function extract(
    _input: unknown,
    _parentContext: ts.AnyObject,
    _args: ExtractFieldConfig
): any | null {}

/**
 * This function replaces chars in a string based off the regex value provided
 *
 * @example
 *
 * const config1 =  { regex: 's|e', replace: 'd' };
 * const results1 = FieldTransform.replaceRegex('somestring', {}, config1)
 * results1 === 'domestring'
 *
 * const config2 = { regex: 's|e', replace: 'd', global: true };
 * const results2 = FieldTransform.replaceRegex('somestring', {}, config)
 * results2 === 'domddtring'
 *
 * const config3 = {
 *   regex: 'm|t', replace: 'W', global: true, ignoreCase: true
 * };
 * const results3 = FieldTransform.replaceRegex('soMesTring', {}, config3))
 * results3 === 'soWesWring'
 *
 * @param {StringInput} input
 * @param {ReplaceRegexConfig} {
 *     regex, replace, ignoreCase, global
 * }
 * @returns { string | string[] | null } returns null if input is null/undefined
 */

export function replaceRegex(
    input: StringInput,
    _parentContext: unknown,
    {
        regex, replace, ignoreCase, global
    }: ReplaceRegexConfig
): string | string[] | null {
    if (ts.isNil(input)) return null;
    let options = '';

    if (ignoreCase) options += 'i';
    if (global) options += 'g';

    if (isArray(input)) {
        return input.filter(ts.isNotNil).map((data: any) => {
            if (!isString(data)) throw new Error(`Input must be a string, or an array of string, received ${ts.getTypeOf(input)}`);
            const re = new RegExp(regex, options);
            return data.replace(re, replace);
        });
    }

    if (!isString(input)) throw new Error(`Input must be a string, or an array of string, received ${ts.getTypeOf(input)}`);

    const re = new RegExp(regex, options);
    return input.replace(re, replace);
}

/**
 * This function replaces the searched value with the replace value
 *
 * @example
 *
 * const context = { key: 'Hi bob' };
 * FieldTransform.replaceLiteral('Hi bob', context, { search: 'bob', replace: 'mel' }) === 'Hi mel';
 * FieldTransform.replaceLiteral('Hi Bob', context, { search: 'bob', replace: 'Mel' }) === 'Hi Bob';
 *
 * const data = ['Hi bob', 'hello bob'];
 * const config = { search: 'bob', replace: 'mel' };
 * FieldTransform.replaceLiteral(data, {}, config) // ['Hi mel', 'hello mel'];
 *
 * @param {StringInput} input
 * @param {ReplaceLiteralConfig} { search, replace }
 * search is the word that is to be changed to the value specified with the paramter replace
 * @returns { string | string[] | null } returns null if input is null/undefined
 */

export function replaceLiteral(
    input: StringInput,
    _parentContext: unknown,
    { search, replace }: ReplaceLiteralConfig
): string | string[] | null {
    if (ts.isNil(input)) return null;

    if (isArray(input)) {
        return input.filter(ts.isNotNil).map((data: any) => {
            if (!isString(data)) throw new Error(`Input must be a string, or an array of string, received ${ts.getTypeOf(data)}`);
            return data.replace(search, replace);
        });
    }

    if (!isString(input)) throw new Error(`Input must be a string, or an array of string, received ${ts.getTypeOf(input)}`);

    try {
        return input.replace(search, replace);
    } catch (e) {
        throw new Error(`Could not replace ${search} with ${replace}`);
    }
}

/**
 * Converts a string to an array of characters split by the delimiter provided
 *
 * @example
 *
 * FieldTransform.splitString('astring'); // ['a', 's', 't', 'r', 'i', 'n', 'g'];
 * FieldTransform.splitString('astring', {}, { delimiter: ',' }); // ['astring'];
 * expect(FieldTransform.splitString(
 *      'a-stri-ng', {}, { delimiter: '-' }
 * )).toEqual(['a', 'stri', 'ng']);
 *
 * @param {*} input
 * @param {{ delimiter: string }} [args] delimter defaults to an empty string
 * @returns {(string[] | null)}
 */

export function splitString(
    input: unknown,
    _parentContext?: unknown,
    args?: { delimiter: string }
): string[]|(string[][]) | null {
    if (ts.isNil(input)) return null;

    const delimiter = args ? args.delimiter : '';

    if (isArray(input)) {
        return input.filter(ts.isNotNil).map((data: any) => {
            if (!ts.isString(data)) {
                throw new Error(`Input must be a string, or an array of string, received ${ts.getTypeOf(data)}`);
            }
            return data.split(delimiter);
        });
    }

    if (ts.isString(input)) {
        return input.split(delimiter);
    }

    throw new Error(`Input must be a string or an array, got ${ts.getTypeOf(input)}`);
}

function _makeUnitTime(input: any, { ms = false } = {}) {
    let time: boolean | number;

    if (ms) {
        time = ts.getTime(input);
    } else {
        time = ts.getUnixTime(input);
    }

    return time as number;
}

/**
 * Converts a given date to its time in milliseconds or seconds
 *
 * @example
 *
 * FieldTransform.toUnixTime('2020-01-01'); // 1577836800;
 * FieldTransform.toUnixTime('Jan 1, 2020 UTC'); // 1577836800;
 * FieldTransform.toUnixTime('2020 Jan, 1 UTC'); // 1577836800;
 *
 * FieldTransform.toUnixTime(1580418907000); // 1580418907;
 * FieldTransform.toUnixTime(1580418907000, {}, { ms: true }); // 1580418907000;
 *
 * FieldTransform.toUnixTime(['Jan 1, 2020 UTC', '2020 Jan, 1 UTC']); // [1577836800, 1577836800];
 *
 * @param {*} input
 * @param {*} [{ ms = false }={}] set ms to true if you want time in milliseconds
 * @returns { number | number[] | null} returns null if input is null/undefined
 */

export function toUnixTime(
    input: unknown, _parentContext?: unknown, { ms = false } = {}
): number | number[] | null {
    if (ts.isNil(input)) return null;

    if (isArray(input)) {
        return input.filter(ts.isNotNil).map((data: any) => {
            if (!isValidDate(data)) {
                throw new Error(`Not a valid date, cannot transform ${data} to unix time`);
            }

            return _makeUnitTime(data, { ms });
        });
    }

    if (!isValidDate(input)) throw new Error(`Not a valid date, cannot transform ${input} to unix time`);

    return _makeUnitTime(input, { ms });
}

function _makeIso(input: any, args?: { resolution?: 'seconds' | 'milliseconds' }) {
    let value = input;
    if (isNumber(input) && args && args.resolution) value *= 1000;

    return new Date(value).toISOString();
}

/**
 * Converts a date string or number to an ISO date
 *
 * @example
 *
 * FieldTransform.toISO8601('2020-01-01'); // '2020-01-01T00:00:00.000Z';
 *
 * const config = { resolution: 'seconds' };
 * FieldTransform.toISO8601(1580418907, {}, config); // '2020-01-30T21:15:07.000Z';
 *
 * const data = ['2020-01-01', '2020-01-02'];
 * FieldTransform.toISO8601(data); // ['2020-01-01T00:00:00.000Z', '2020-01-02T00:00:00.000Z'];
 *
 * @param {*} input
 * @param {({ resolution?: 'seconds' | 'milliseconds' })} [args]
 * if input is a number, you may specify the resolution of that number, defaults to seconds
 * @returns { string | string[] | null } returns null if input is null/undefined
 */

export function toISO8601(
    input: unknown, _parentContext?: unknown, args?: { resolution?: 'seconds' | 'milliseconds' }
): string | string[] | null {
    if (ts.isNil(input)) return null;

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((data: any) => {
                if (!isValidDate(data)) {
                    throw new Error(`Input is not valid date, received ${data}`);
                }

                return _makeIso(data, args);
            });
    }

    if (!isValidDate(input)) {
        throw new Error(`Input is not valid date, received ${input}`);
    }

    return _makeIso(input, args);
}

export interface FormatDateConfig {
    format: string;
    resolution?: 'seconds' | 'milliseconds';
}

function _formatDate(input: any, args: FormatDateConfig) {
    if (!isValidDate(input)) {
        throw new Error('Input is not valid date');
    }

    let value = input;
    const { format, resolution } = args;

    if (!isString(format)) throw new Error(`Invalid parameter format, must be a string, received ${ts.getTypeOf(input)}`);

    if (isString(value)) value = new Date(value);
    if (isNumber(value) && resolution === 'seconds') value *= 1000;

    return dateFormat(value, format);
}

/**
 * Function that will format a number or date string to a given date format provided
 *
 * @example
 *
 * const config = { format: 'MMM do yy' };
 * const results1 = FieldTransform.formatDate('2020-01-14T20:34:01.034Z', {}, config)
 * results1 === 'Jan 14th 20';
 *
 * const results2 = FieldTransform.formatDate('March 3, 2019', {}, { format: 'M/d/yyyy' })
 * results2 === '3/3/2019';
 *
 * const config =  { format: 'yyyy-MM-dd', resolution: 'seconds' };
 * const results3 = FieldTransform.formatDate(1581013130, {}, config)
 * results3 === '2020-02-06';
 *
 * const config =  { format: 'yyyy-MM-dd' };
 * const results = FieldTransform.formatDate([1581013130856, undefined], {}, config)
 * results // ['2020-02-06']);
 *
 * @param {*} input
 * @param {{ format: string, resolution?: 'seconds' | 'milliseconds' }} args
 * format is the shape that the date will be, resolution is only needed when input is a number
 * @returns { string | string[] | null } returns null if input is null/undefined
 */

export function formatDate(
    input: unknown, _parentContext: unknown, args: FormatDateConfig
): string | string[] | null {
    if (ts.isNil(input)) return null;

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((data: any) => _formatDate(data, args));
    }

    return _formatDate(input, args);
}

export interface ParseDateConfig {
    format: string;
}

function _parseDate(input: any, args: ParseDateConfig) {
    if (ts.isNil(input)) return null;

    const { format } = args;
    if (!isString(format)) {
        throw new Error(`Invalid parameter format, must be a string, received ${ts.getTypeOf(input)}`);
    }

    const inputStr = String(input);

    const parsed = parse(inputStr, format, new Date());

    if (!ts.isValidDateInstance(parsed)) {
        throw new Error('Cannot parse date');
    }

    return parsed;
}

/**
 * Will use date-fns parse against the input and return a date object
 *
 * @example
 *
 * const result = FieldTransform.parseDate('2020-01-10-00:00', {}, { format: 'yyyy-MM-ddxxx' })
 * result === new Date('2020-01-10T00:00:00.000Z');
 *
 * const result = FieldTransform.parseDate('Jan 10, 2020-00:00', {}, { format: 'MMM dd, yyyyxxx' })
 * result === new Date('2020-01-10T00:00:00.000Z');
 *
 * const result = FieldTransform.parseDate(1581025950223, {}, { format: 'T' })
 * result === new Date('2020-02-06T21:52:30.223Z');
 *
 * const result = FieldTransform.parseDate(1581025950, {}, { format: 't' })
 * result === new Date('2020-02-06T21:52:30.000Z');
 *
 * const result = FieldTransform.parseDate('1581025950', {} { format: 't' })
 * result === new Date('2020-02-06T21:52:30.000Z');
 *
 * @param {*} input
 * @param { format: string } args
 * @returns { Date | Date[] | null } returns null if input is null/undefined
 */

export function parseDate(
    input: unknown, _parentContext: unknown, args: ParseDateConfig
): Date | (Date | null)[] | null {
    if (ts.isNil(input)) return null;

    if (isArray(input)) {
        return input
            .filter(ts.isNotNil)
            .map((data: any) => _parseDate(data, args));
    }

    return _parseDate(input, args);
}

/**
 * Will convert a string, or an array of strings to camel case;
 *
 * @example
 * FieldTransform.toCamelCase('I need camel case'); // 'iNeedCamelCase';
 * FieldTransform.toCamelCase('happyBirthday'); // 'happyBirthday';
 * FieldTransform.toCamelCase('what_is_this'); // 'whatIsThis';
 *
 * const array = ['what_is_this', 'I need camel case'];
 * FieldTransform.toCamelCase(array); // ['whatIsThis', 'iNeedCamelCase'];
 *
 * @param {string | string[]} input
 * @returns { string | string[] | null } returns null if input is null/undefined
 */

export function toCamelCase(
    input: string, _parentContext?: unknown
): string | string[] | null {
    if (ts.isNil(input)) return null;
    if (isArray(input)) return input.filter(ts.isNotNil).map(ts.toCamelCase);

    return ts.toCamelCase(input);
}

/**
 * Will convert a string, or an array of strings to kebab case
 * @example
 *
 * FieldTransform.toKebabCase('I need kebab case'); // 'i-need-kebab-case';
 * FieldTransform.toKebabCase('happyBirthday'); // 'happy-birthday';
 * FieldTransform.toKebabCase('what_is_this'); // 'what-is-this';
 * FieldTransform.toKebabCase('this-should-be-kebab'); // 'this-should-be-kebab';
 *
 * const array = ['happyBirthday', 'what_is_this']
 * FieldTransform.toKebabCase(array); // ['happy-birthday', 'what-is-this'];
 *
 * @param {string | string[]} input
 * @returns { string | string[] | null } returns null if input is null/undefined
 */

export function toKebabCase(
    input: string, _parentContext?: unknown
): string | string[] | null {
    if (ts.isNil(input)) return null;
    if (isArray(input)) return input.filter(ts.isNotNil).map(ts.toKebabCase);

    return ts.toKebabCase(input);
}

/**
 * Converts a string, or an array of strings to pascal case
 *
 * @example
 * FieldTransform.toPascalCase('I need pascal case'); // 'INeedPascalCase';
 * FieldTransform.toPascalCase('happyBirthday'); // 'HappyBirthday';
 * FieldTransform.toPascalCase('what_is_this'); // 'WhatIsThis';
 *
 * const array = ['happyBirthday', 'what_is_this']
 * FieldTransform.toKebabCase(array); // ['HappyBirthday', 'WhatIsThis'];
 *
 * @param {string | string[]} input
 * @returns { string | string[] | null } returns null if input is null/undefined
 */

export function toPascalCase(input: string, _parentContext?: unknown): string | string[] | null {
    if (ts.isNil(input)) return null;
    if (isArray(input)) return input.filter(ts.isNotNil).map(ts.toPascalCase);

    return ts.toPascalCase(input);
}

/**
 * Converts a string, or an array of strings to snake case
 * @example
 * FieldTransform.toSnakeCase('I need snake case'); // 'i_need_snake_case';
 * FieldTransform.toSnakeCase('happyBirthday'); // 'happy_birthday';
 * FieldTransform.toSnakeCase('what_is_this'); // 'what_is_this';
 *
 * const array = ['happyBirthday', 'what_is_this']
 * FieldTransform.toKebabCase(array); // ['happy_birthday', 'what_is_this'];
 *
 * @param {string | string[]} input
 * @returns { string | string[] | null } returns null if input is null/undefined
 */

export function toSnakeCase(input: string, _parentContext?: unknown): string | string[] | null {
    if (ts.isNil(input)) return null;
    if (isArray(input)) return input.filter(ts.isNotNil).map(ts.toSnakeCase);

    return ts.toSnakeCase(input);
}

/**
 * Converts a string, or an array of strings to title case
 * @example
 * FieldTransform.toTitleCase('I need some capitols'); // 'I Need Some Capitols';
 * FieldTransform.toTitleCase('happyBirthday'); // 'Happy Birthday';
 * FieldTransform.toTitleCase('what_is_this'); // 'What Is This';
 *
 * @param {string | string[]} input
 * @returns { string | string[] | null } returns null if input is null/undefined
 */

export function toTitleCase(input: string, _parentContext?: unknown): string | string[] | null {
    if (ts.isNil(input)) return null;
    if (isArray(input)) return input.filter(ts.isNotNil).map(ts.toTitleCase);

    return ts.toTitleCase(input);
}

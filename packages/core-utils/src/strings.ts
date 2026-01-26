import validator, { UUIDVersion } from 'validator';
import {
    trim as lTrim,
    trimStart as lTrimStart,
    trimEnd as lTrimEnd,
    camelCase as lCamelCase,
    snakeCase as lSnakeCase,
    kebabCase as lKebabCase,
    startCase as lStartCase,
} from 'lodash-es';
import { MACDelimiter } from '@terascope/types';
import { isArrayLike } from './arrays.js';
import { getTypeOf } from './deps.js';
import { bigIntToJSON } from './numbers.js';

/** A simplified implementation of lodash isString */
export function isString(val: unknown): val is string {
    return typeof val === 'string';
}

/**
 * Safely convert any input to a string
 *
 * @example
 *
 *     toString(1); // '1'
 *     toString(0.01); // '0.01'
 *     toString(true); // 'true'
 *     toString(BigInt(2) ** BigInt(64)); // '18,446,744,073,709,551,616'
 *     toString(new Date('2020-09-23T14:54:21.020Z')) // '2020-09-23T14:54:21.020Z'
*/
export function toString(val: unknown): string {
    if (val == null) return '';
    if (typeof val === 'string') return val;

    if (typeof val === 'number' || typeof val === 'symbol' || typeof val === 'boolean') {
        return String(val);
    }

    if (typeof val === 'bigint') {
        const res = bigIntToJSON(val);
        if (typeof res === 'string') return res;
        return `${res}`;
    }

    if (typeof val === 'function') {
        return val.toString();
    }

    if (isArrayLike(val)) {
        return val.map(toString).join(',');
    }

    if (val instanceof Date) {
        return val.toISOString();
    }

    if (typeof val === 'object' && val != null) {
        if (Symbol.iterator in val) {
            return [...val as any].map(toString).join(',');
        }

        // is error
        if ('message' in val && 'stack' in val) {
            return val.toString();
        }

        if (Symbol.toPrimitive in val) {
            return `${val}`;
        }

        if (typeof (val as any).toJSON === 'function') {
            return toString((val as any).toJSON());
        }
    }

    // fall back to this
    return JSON.stringify(val);
}

/**
 * Check if a value is a JavaScript primitive value OR
 * it is object with Symbol.toPrimitive
*/
export function isPrimitiveValue(value: unknown): boolean {
    const type = typeof value;
    if (type === 'string') return true;
    if (type === 'boolean') return true;
    if (type === 'number') return true;
    if (type === 'bigint') return true;
    if (type === 'symbol') return true;
    if (type === 'object' && typeof (value as any)[Symbol.toPrimitive] === 'function') return true;
    return false;
}

/**
 * Convert a JavaScript primitive value to a string.
 * (Does not covert object like entities unless Symbol.toPrimitive is specified)
*/
export function primitiveToString(value: unknown): string {
    if (value == null) return '';
    if (!isPrimitiveValue(value)) {
        throw new Error(`Expected ${value} (${getTypeOf(value)}) to be in a string like format`);
    }
    return `${value}`;
}

/** safely trims whitespace from an input */
export function trim(input: unknown, char?: string): string {
    return lTrim(primitiveToString(input), char);
}

export function trimFP(char?: string) {
    return function _trim(input: unknown): string {
        return trim(input, char);
    };
}

export function trimStart(input: unknown, char?: string): string {
    return lTrimStart(primitiveToString(input), char);
}

export function trimStartFP(char?: string) {
    return function _trimStart(input: unknown): string {
        return trimStart(input, char);
    };
}

export function trimEnd(input: unknown, char?: string): string {
    return lTrimEnd(primitiveToString(input), char);
}

export function trimEndFP(char?: string) {
    return function _trimEnd(input: unknown): string {
        return trimEnd(input, char);
    };
}

/** safely trim and to lower a input, useful for string comparison */
export function trimAndToLower(input?: string): string {
    return trim(input).toLowerCase();
}

/** safely trim and to lower a input, useful for string comparison */
export function trimAndToUpper(input?: string): string {
    return trim(input).toUpperCase();
}

/**
 * Converts a value to upper case
 *
 * @example
 *
 *     toUpperCase('lowercase'); // 'LOWERCASE'
 *     toUpperCase('MixEd'); // 'MIXED'
 *     toUpperCase('UPPERCASE'); // 'UPPERCASE'
*/
export function toUpperCase(input: unknown): string {
    if (typeof input !== 'string') return '';
    return input.toUpperCase();
}

/**
 * Converts a value to lower case
 *
  * @example
 *
 *     toLowerCase('lowercase'); // 'lowercase'
 *     toLowerCase('MixEd'); // 'mixed'
 *     toLowerCase('UPPERCASE'); // 'uppercase'
*/
export function toLowerCase(input: unknown): string {
    if (typeof input !== 'string') return '';
    return input.toLowerCase();
}

/** Unescape characters in string and avoid double escaping */
export function unescapeString(str = ''): string {
    const len = str.length;
    let unescaped = '';

    for (let i = 0; i < len; i++) {
        const char = str.charAt(i);
        const next = i < len ? str.charAt(i + 1) : '';
        if (char === '\\' && next) {
            unescaped += next;
            i++;
        } else {
            unescaped += char;
        }
    }

    return unescaped;
}

/** A native implementation of lodash startsWith */
export function startsWith(str: unknown, val: unknown): boolean {
    if (!isString(str)) return false;
    if (!isString(val)) return false;

    return str.startsWith(val);
}

/** A function version of startsWith */
export function startsWithFP(val: string): (input: unknown) => boolean {
    if (!isString(val)) {
        throw new Error(`Invalid argument "val", must be of type string, got ${getTypeOf(val)}`);
    }
    return function _startsWithFP(str: unknown): boolean {
        return startsWith(str, val);
    };
}

/** A native implementation of lodash endsWith */
export function endsWith(str: unknown, val: unknown): boolean {
    if (!isString(str)) return false;
    if (!isString(val)) return false;

    return str.endsWith(val);
}

/** A function version of startsWith */
export function endsWithFP(val: string): (input: unknown) => boolean {
    if (!isString(val)) {
        throw new Error(`Invalid argument "val", must be of type string, got ${getTypeOf(val)}`);
    }
    return function _startsWithFP(str: unknown): boolean {
        return endsWith(str, val);
    };
}

/**
 * Truncate a string value, by default it will add an ellipsis (...) if truncated.
*/
export function truncate(value: unknown, len: number, ellipsis = true): string {
    if (value == null || value === '') return '';
    if (!isString(value)) {
        throw new SyntaxError(`Expected string value to truncate, got ${getTypeOf(value)}`);
    }

    if (!ellipsis) return value.slice(0, len);

    const sliceLen = len - 4 > 0 ? len - 4 : len;
    return value.length >= len ? `${value.slice(0, sliceLen)} ...` : value;
}

/**
 * A functional version of truncate
*/
export function truncateFP(len: number, ellipsis = true) {
    return function _truncateFP(value: unknown): string {
        return truncate(value, len, ellipsis);
    };
}

export const LOWER_CASE_CHARS = {
    a: true,
    b: true,
    c: true,
    d: true,
    e: true,
    f: true,
    g: true,
    h: true,
    i: true,
    j: true,
    k: true,
    l: true,
    m: true,
    n: true,
    o: true,
    p: true,
    q: true,
    r: true,
    s: true,
    t: true,
    u: true,
    v: true,
    w: true,
    x: true,
    y: true,
    z: true,
} as const;

export const UPPER_CASE_CHARS = {
    A: true,
    B: true,
    C: true,
    D: true,
    E: true,
    F: true,
    G: true,
    H: true,
    I: true,
    J: true,
    K: true,
    L: true,
    M: true,
    N: true,
    O: true,
    P: true,
    Q: true,
    R: true,
    S: true,
    T: true,
    U: true,
    V: true,
    W: true,
    X: true,
    Y: true,
    Z: true,
} as const;

export const NUM_CHARS = {
    0: true,
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
    7: true,
    8: true,
    9: true,
} as const;

export const WORD_SEPARATOR_CHARS = {
    ' ': true,
    _: true,
    '-': true,
} as const;

export const WORD_CHARS = {
    ...LOWER_CASE_CHARS,
    ...UPPER_CASE_CHARS,
    ...NUM_CHARS,
} as const;

/**
 * Split a string and get the word parts
*/
export function getWordParts(input: string): string[] {
    if (!isString(input)) {
        throw new Error(`Expected string, got ${getTypeOf(input)}`);
    }

    const parts: string[] = [];

    let word = '';
    let started = false;

    for (let i = 0; i < input.length; i++) {
        const char = input.charAt(i);
        const nextChar = input.charAt(i + 1);

        if (!started && char === '_') {
            if (nextChar === '_' || nextChar in WORD_CHARS) {
                word += char;
                continue;
            }
        }

        started = true;

        if (char && char in WORD_CHARS) {
            word += char;
        }

        if (nextChar in WORD_SEPARATOR_CHARS) {
            parts.push(word);
            word = '';
        }

        if (nextChar in UPPER_CASE_CHARS) {
            const nextNextChar = input.charAt(i + 2);
            if (nextNextChar in LOWER_CASE_CHARS) {
                parts.push(word);
                word = '';
            }
        }
    }

    return parts.concat(word).filter(Boolean);
}

export function toCamelCase(input: string): string {
    return lCamelCase(input);
}

export function toPascalCase(input: string): string {
    return firstToUpper(lCamelCase(input));
}

export function toKebabCase(input: string): string {
    return lKebabCase(input);
}

export function toSnakeCase(input: string): string {
    return lSnakeCase(input);
}

export function toTitleCase(input: string): string {
    return lStartCase(input);
}

/**
 * Make a string url/elasticsearch safe.
 * safeString converts the string to lower case,
 * removes any invalid characters,
 * and replaces whitespace with _ (if it exists in the string) or -
 * Warning this may reduce the str length
 */
export function toSafeString(input: string): string {
    let s = trimAndToLower(input);
    const startReg = /^[_\-+]+/;
    while (startReg.test(s)) {
        s = s.replace(startReg, '');
    }

    const whitespaceChar = s.includes('_') ? '_' : '-';
    s = s.replace(/\s/g, whitespaceChar);
    const reg = /[.+#*?"<>|/\\\\]/g;
    s = s.replace(reg, '');

    return s;
}
function _replaceFirstWordChar(str: string, fn: (char: string) => string): string {
    let found = false;
    return str.split('').map((s) => {
        if (!found && s in WORD_CHARS) {
            found = true;
            return fn(s);
        }
        return s;
    })
        .join('');
}

/** Change first character in string to upper case */
export function firstToUpper(str: string): string {
    if (!str) return '';
    return _replaceFirstWordChar(str, (char) => char.toUpperCase());
}

/** Change first character in string to lower case */
export function firstToLower(str: string): string {
    if (!str) return '';
    return _replaceFirstWordChar(str, (char) => char.toLowerCase());
}

export function getFirstChar(input: string): string {
    if (!input) return '';
    return trim(input).charAt(0);
}

// http://www.regular-expressions.info/email.html
// not an exhaustive email regex, which is impossible, but will catch obvious errors
// is more lenient in most cases
const EmailRegex = /^[A-Z0-9._%+-@]{1,64}@(?:[A-Z0-9-]{1,63}\.){1,8}[A-Z]{2,63}$/i;
export function isEmail(input: unknown): input is string {
    return isString(input) && EmailRegex.test(input);
}

const macAddressDelimiters = {
    colon: /^([0-9a-fA-F][0-9a-fA-F]:){5}([0-9a-fA-F][0-9a-fA-F])$/,
    space: /^([0-9a-fA-F][0-9a-fA-F]\s){5}([0-9a-fA-F][0-9a-fA-F])$/,
    dash: /^([0-9a-fA-F][0-9a-fA-F]-){5}([0-9a-fA-F][0-9a-fA-F])$/,
    dot: /^([0-9a-fA-F]{4}\.){2}([0-9a-fA-F]{4})$/,
    none: /^([0-9a-fA-F]){12}$/
} as const;

export function isMACAddress(
    input: unknown, delimiter?: MACDelimiter
): input is string {
    if (!isString(input)) return false;

    if (!delimiter || delimiter === 'any') {
        return Object.values(macAddressDelimiters).some((d) => d.test(input));
    }

    return macAddressDelimiters[delimiter].test(input);
}

/**
 * A functional version of isMacAddress
*/
export function isMACAddressFP(args?: MACDelimiter) {
    return function _isMacAddressFP(input: unknown): input is string {
        return isMACAddress(input, args);
    };
}

export function isURL(input: unknown): boolean {
    return isString(input) && validator.isURL(input);
}

export function isUUID(input: unknown, version: UUIDVersion = 'all'): boolean {
    return isString(input) && validator.isUUID(input, version);
}

/**
 * Check whether a string includes another string
*/
export function contains(input: unknown, substring: string): input is string {
    return isString(input) && input.includes(substring);
}

/**
 * A function version of contains
*/
export function containsFP(substring: string) {
    return function _contains(input: unknown): input is string {
        return isString(input) && input.includes(substring);
    };
}

export function isBase64(input: unknown): boolean {
    if (!isString(input)) return false;

    const validatorValid = validator.isBase64(input);

    if (validatorValid) {
        const decode = Buffer.from(input, 'base64').toString('utf8');
        const encode = Buffer.from(decode, 'utf8').toString('base64');

        return input === encode;
    }

    return false;
}

export function isFQDN(input: unknown): boolean {
    return isString(input) && validator.isFQDN(input);
}

export function isCountryCode(input: unknown): boolean {
    return isString(input) && validator.isISO31661Alpha2(input);
}

export function isPostalCode(input: unknown, locale: validator.PostalCodeLocale | 'any' = 'any'): boolean {
    return validator.isPostalCode(toString(input), locale);
}

export function isPort(input: unknown): boolean {
    return validator.isPort(toString(input));
}

export function isAlpha(input: unknown, locale?: validator.AlphaLocale): boolean {
    return isString(input) && validator.isAlpha(input, locale);
}

export function isAlphaNumeric(input: unknown, locale?: validator.AlphanumericLocale): boolean {
    return isString(input) && validator.isAlphanumeric(input, locale);
}

export function isMIMEType(input: unknown): boolean {
    return validator.isMimeType(toString(input));
}

/**
 * Maps an array of strings and and trims the result, or
 * parses a comma separated list and trims the result
 */
export function parseList(input: unknown): string[] {
    let strings: string[] = [];

    if (isString(input)) {
        strings = input.split(',');
    } else if (isArrayLike(input)) {
        strings = input.map((val) => {
            if (!val) return '';
            return toString(val);
        });
    } else {
        return [];
    }

    return strings.map((s) => s.trim()).filter((s) => !!s);
}

type JoinListType = string | number | boolean | symbol | null | undefined;
/**
 * Create a sentence from a list (all items will be unique, empty values will be skipped)
*/
export function joinList(
    input: (JoinListType)[] | readonly (JoinListType)[],
    sep = ',',
    join = 'and'
): string {
    if (!Array.isArray(input)) {
        throw new Error('joinList requires input to be a array');
    }

    const list = [
        ...new Set(input
            .filter((str) => str != null && str !== '')
            .map((str) => toString(str).trim()))
    ];

    if (list.length === 0) {
        throw new Error('joinList requires at least one string');
    }
    if (list.length === 1) return `${list[0]}`;

    return list.reduce((acc, curr, index, arr) => {
        if (!acc) return curr;
        const isLast = (index + 1) === arr.length;
        if (isLast) {
            return `${acc} ${join} ${curr}`;
        }
        return `${acc}${sep} ${curr}`;
    }, '');
}

export type StringEntropyFN = (input: unknown) => number;

// inspired from https://gist.github.com/jabney/5018b4adc9b2bf488696
/** Performs a Shannon entropy calculation on string inputs */
export function shannonEntropy(input: unknown): number {
    if (!isString(input)) {
        throw new Error(`Invalid input ${input}, must be of type String`);
    }

    let sum = 0;
    const len = input.length;
    const dict: Record<string, number> = Object.create(null);

    // get number of chars per string
    for (const char of input) {
        if (dict[char] != null) {
            dict[char]++;
        } else {
            dict[char] = 1;
        }
    }

    for (const num of Object.values(dict)) {
        const p = num / len;
        const pLogCalc = p * Math.log(p);
        sum -= pLogCalc / Math.log(2);
    }

    return sum;
}

export enum StringEntropy {
    shannon = 'shannon'
}

const StringEntropyDict: Record<StringEntropy, StringEntropyFN> = {
    [StringEntropy.shannon]: shannonEntropy
};

/** returns a function to perform entropy calculations, currently only supports
 * the "shannon" algorithm
 * */
export function stringEntropy(
    algo: StringEntropy = StringEntropy.shannon
): StringEntropyFN {
    const fn = StringEntropyDict[algo];

    if (fn == null) {
        const keys = Object.keys(StringEntropyDict);
        throw new Error(`Unsupported algorithm ${algo}, please use the available algorithms ${joinList(keys, ', ')}`);
    }

    return fn;
}

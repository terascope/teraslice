import { MACAddress } from '@terascope/types';

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
        return (val as BigInt).toLocaleString();
    }

    if (typeof val === 'function') {
        return val.toString();
    }

    if (Array.isArray(val)) {
        return val.map(toString).join(',');
    }

    if (val instanceof Date) {
        return val.toISOString();
    }

    if (typeof val === 'object' && val != null) {
        if (val[Symbol.iterator]) {
            return [...val as any].map(toString).join(',');
        }

        // is error
        if ('message' in val && 'stack' in val) {
            return val.toString();
        }

        if (val[Symbol.toPrimitive]) {
            return `${val}`;
        }

        if (typeof (val as any).toJSON === 'function') {
            return toString((val as any).toJSON());
        }
    }

    // fall back to this
    return JSON.stringify(val);
}

/** safely trim an input */
export function trim(input: unknown, char = ' '): string {
    if (char === ' ') return toString(input).trim();

    return trimEnd(trimStart(input, char), char);
}

export function trimStart(input: unknown, char = ' '): string {
    const str = toString(input);
    if (char === ' ') {
        return str.replace(/^\s+/, '');
    }

    let start = str.indexOf(char);
    if (start === -1 || start > (str.length / 2)) return str;

    for (start; start < str.length;) {
        if (str.slice(start, start + char.length) !== char) {
            break;
        }
        start += char.length;
    }

    return str.slice(start);
}

export function trimEnd(input: unknown, char = ' '): string {
    const str = toString(input);
    if (char === ' ') {
        return str.replace(/\s+$/, '');
    }

    let end = str.lastIndexOf(char);
    if (end === -1 || end < (str.length / 2)) return str;

    for (end; end >= 0;) {
        if (str.slice(end - char.length, end) !== char) {
            break;
        }
        end -= char.length;
    }

    return str.slice(0, end);
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
export function startsWith(str: string, val: string): boolean {
    if (!isString(val)) return false;
    return str.startsWith(val);
}

export function truncate(str: string, len: number): string {
    const sliceLen = len - 4 > 0 ? len - 4 : len;
    return str.length >= len ? `${str.slice(0, sliceLen)} ...` : str;
}

const lowerChars = {
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
};

const upperChars = {
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
};

const numChars = {
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
};

const sepChars = {
    ' ': true,
    _: true,
    '-': true,
};

const wordChars = {
    ...lowerChars,
    ...upperChars,
    ...numChars,
};

/**
 * Split a string and get the word parts
*/
export function getWordParts(input: string): string[] {
    if (!isString(input)) {
        throw new Error(`Expected string, got "${input}"`);
    }

    const parts: string[] = [];

    let word = '';
    let started = false;

    for (let i = 0; i < input.length; i++) {
        const char = input.charAt(i);
        const nextChar = input.charAt(i + 1);

        if (!started && char === '_') {
            if (nextChar === '_' || wordChars[nextChar]) {
                word += char;
                continue;
            }
        }

        started = true;

        if (char && wordChars[char]) {
            word += char;
        }

        if (sepChars[nextChar]) {
            parts.push(word);
            word = '';
        }

        if (upperChars[nextChar]) {
            const nextNextChar = input.charAt(i + 2);
            if (lowerChars[nextNextChar]) {
                parts.push(word);
                word = '';
            }
        }
    }

    return parts.concat(word).filter(Boolean);
}

export function toCamelCase(input: string): string {
    return firstToLower(getWordParts(input).map((str, i) => {
        if (i === 0) return str;
        return firstToUpper(str);
    }).join(''));
}

export function toPascalCase(input: string): string {
    return firstToUpper(getWordParts(input).map((str, i) => {
        if (i === 0) return str;
        return firstToUpper(str);
    }).join(''));
}

export function toKebabCase(input: string): string {
    return getWordParts(input).join('-').toLowerCase();
}

export function toSnakeCase(input: string): string {
    return getWordParts(input).join('_').toLowerCase();
}

export function toTitleCase(input: string): string {
    return firstToUpper(getWordParts(input).map((str) => firstToUpper(str)).join(' '));
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
    const reg = new RegExp('[.+#*?"<>|/\\\\]', 'g');
    s = s.replace(reg, '');

    return s;
}
function _replaceFirstWordChar(str: string, fn: (char: string) => string): string {
    let found = false;
    return str.split('').map((s) => {
        if (!found && wordChars[s]) {
            found = true;
            return fn(s);
        }
        return s;
    }).join('');
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

export function isEmail(input: unknown): boolean {
    // Email Validation as per RFC2822 standards. Straight from .net helpfiles
    // eslint-disable-next-line
    const regex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
    if (isString(input) && input.toLowerCase().match(regex)) return true;

    return false;
}

export function isMacAddress(input: unknown, args?: MACAddress): boolean {
    if (!isString(input)) return false;

    const delimiters = {
        colon: /^([0-9a-fA-F][0-9a-fA-F]:){5}([0-9a-fA-F][0-9a-fA-F])$/,
        space: /^([0-9a-fA-F][0-9a-fA-F]\s){5}([0-9a-fA-F][0-9a-fA-F])$/,
        dash: /^([0-9a-fA-F][0-9a-fA-F]-){5}([0-9a-fA-F][0-9a-fA-F])$/,
        dot: /^([0-9a-fA-F]{4}\.){2}([0-9a-fA-F]{4})$/,
        none: /^([0-9a-fA-F]){12}$/
    };

    const delimiter = args && args.delimiter ? args.delimiter : 'any';

    if (delimiter === 'any') {
        return Object.keys(delimiters).some((d) => delimiters[d].test(input));
    }

    if (Array.isArray(delimiter)) {
        return delimiter.some((d) => delimiters[d].test(input));
    }

    return delimiters[delimiter].test(input);
}

/**
 * Maps an array of strings and and trims the result, or
 * parses a comma separated list and trims the result
 */
export function parseList(input: unknown): string[] {
    let strings: string[] = [];

    if (isString(input)) {
        strings = input.split(',');
    } else if (Array.isArray(input)) {
        strings = input.map((val) => {
            if (!val) return '';
            return toString(val);
        });
    } else {
        return [];
    }

    return strings.map((s) => s.trim()).filter((s) => !!s);
}

/**
 * Create a sentence from a list (all items will be unique, empty values will be skipped)
*/
export function joinList(input: (string|number|boolean|symbol|null|undefined)[], sep = ',', join = 'and'): string {
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

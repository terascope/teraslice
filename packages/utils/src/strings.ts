import jsStringEscape from 'js-string-escape';

/** A simplified implemation of lodash isString */
export function isString(val: any): val is string {
    return typeof val === 'string';
}

/** Safely convert any input to a string */
export function toString(val: any): string {
    if (val == null) return '';
    if (isString(val)) return val;
    if (typeof val === 'number' && !Number.isNaN(val)) return `${val}`;
    if (val.message && val.stack) {
        return val.toString();
    }

    return JSON.stringify(val);
}

/** safely trim and to lower a input, useful for string comparison */
export function trimAndToLower(input?: string): string {
    return trim(input).toLowerCase();
}

/** safely trim and to lower a input, useful for string comparison */
export function trimAndToUpper(input?: string): string {
    return trim(input).toUpperCase();
}

/** Escape characters in string and avoid double escaping */
export function escapeString(input: string|number): string {
    return jsStringEscape(`${input}`);
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

/** safely trim an input */
export function trim(input: any): string {
    return toString(input).trim();
}

/** A native implemation of lodash startsWith */
export function startsWith(str: string, val: string) {
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

export type FormatRegexResult = [string, string|undefined];

export function formatRegex(str: string): FormatRegexResult {
    const isRegex = /^\/(.*)\/([igsmx]{1,})?$/.exec(str);
    if (isRegex) {
        return [isRegex[1], isRegex[2]];
    }
    return [str, undefined];
}

export function match(regexp: string, value: string) {
    const [reg, options] = formatRegex(regexp);
    const regex = new RegExp(reg, options);
    const results = regex.exec(value);
    if (results) return results[0];
    return results;
}

export function matchAll(regexp: string, str: string): string[]|null {
    const [reg, formatOptions] = formatRegex(regexp);
    let options = formatOptions || 'g';

    if (!options.includes('g')) options = `g${options}`;

    const regex = new RegExp(reg, options);
    const matches: string[] = [];
    let matchedData = regex.exec(str);

    while (matchedData != null && matchedData[0]) {
        if (matchedData && matchedData.length > 1) {
            matches.push(...matchedData.slice(1));
        } else {
            matches.push(matchedData[0]);
        }
        matchedData = regex.exec(str);
    }

    if (matches.length === 0) return null;
    return matches;
}

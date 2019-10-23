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
export function escapeString(str: string|number): string {
    return jsStringEscape(`${str || ''}`);
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

/** Change first character in string to upper case */
export function firstToUpper(str: string): string {
    return `${getFirstChar(str).toUpperCase()}${str.slice(1)}`;
}

/** Change first character in string to lower case */
export function firstToLower(str: string): string {
    return `${getFirstChar(str).toLowerCase()}${str.slice(1)}`;
}

export function getFirstChar(input: string): string {
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

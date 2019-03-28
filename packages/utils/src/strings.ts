/** A simplified implemation of lodash isString */
export function isString(val: any): val is string {
    return typeof val === 'string' ? true : false;
}

/** Safely convert any input to a string */
export function toString(val: any): string {
    if (val == null) return '';
    if (isString(val)) return val;
    if (val && typeof val === 'object' && val.message && val.stack) {
        return val.toString();
    }

    return JSON.stringify(val);
}
/** safely trim and to lower a input, useful for string comparison */
export function trimAndToLower(input?: string): string {
    return trim(input).toLowerCase();
}

/** safely trim an input */
export function trim(input: any): string {
    return toString(input).trim();
}

/** A native implemation of lodash startsWith */
export function startsWith(str: string, val: string) {
    if (typeof str !== 'string') return false;
    return str.startsWith(val);
}

export function truncate(str: string, len: number): string {
    const sliceLen = (len - 4) > 0 ? len - 4 : len;
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
    const startReg = /^[_\-\+]+/;
    while (startReg.test(s)) {
        s = s.replace(startReg, '');
    }

    const whitespaceChar = s.includes('_') ? '_' : '-';
    s = s.replace(/\s/g, whitespaceChar);
    const reg = new RegExp('[\.\+#*?"<>|/\\\\]', 'g');
    s = s.replace(reg, '');
    return s;
}

/** Change first character in string to upper case */
export function firstToUpper(str: string): string {
    return `${getFirstChar(str).toUpperCase()}${str.slice(1)}`;
}

export function getFirstChar(input: string): string {
    return trim(input).charAt(0);
}

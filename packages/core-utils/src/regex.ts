import { WORD_CHARS } from './strings.js';

export function isRegExp(input: unknown): input is RegExp {
    if (input == null) return false;
    if (input instanceof RegExp) return true;
    return typeof (input as any).flags === 'string'
        && typeof (input as any).ignoreCase === 'boolean'
        && typeof (input as any).multiline === 'boolean'
        && typeof (input as any).global === 'boolean';
}

export function isRegExpLike(input: unknown, strict = true): boolean {
    if (typeof input === 'string') {
        if (strict) {
            return /^\/(.*)\/([igsmx]{1,})?$/.test(input);
        }
        return true;
    }
    return isRegExp(input);
}

type RegexFlag = 'g' | 'i' | 's' | 'm' | 'x';
function _uniqFlags(existing?: string, flags?: RegexFlag[]): string | undefined {
    if (!existing) {
        if (flags?.length) return flags.join('');
        return undefined;
    }
    if (!flags?.length) return existing;

    // build a unique list of the flags
    const allFlags = new Set([...existing, ...flags]);
    return [...allFlags].join('');
}

export function formatRegex(
    input: RegExp | string, flags?: RegexFlag[]
): RegExp {
    if (typeof input === 'string') {
        const result = /^\/(.*)\/([igsmx]{1,})?$/.exec(input);
        if (result) {
            return new RegExp(result[1], _uniqFlags(result[2], flags));
        }
        return new RegExp(input, flags?.join(''));
    }

    const existingFlags = typeof input === 'string' ? '' : input.flags;
    return new RegExp(input, _uniqFlags(existingFlags, flags));
}

export function match(regexp: string | RegExp, value: string): string | null {
    if (!isRegExpLike(regexp, false)) return null;

    const regex = formatRegex(regexp);
    const results = regex.exec(String(value));

    if (results) return results[0];
    return results;
}

/**
 * A functional version of match
*/
export function matchFP(regexp: string | RegExp): (value: string) => string | null {
    return match.bind(match, regexp);
}

export function matchAll(regexp: RegExp | string, value: string): string[] | null {
    if (!isRegExpLike(regexp, false)) return null;

    const regex = formatRegex(regexp, ['g']);

    const matches: string[] = [];
    let matchedData = regex.exec(String(value));

    while (matchedData != null && matchedData[0]) {
        if (matchedData && matchedData.length > 1) {
            matches.push(...matchedData.slice(1));
        } else {
            matches.push(matchedData[0]);
        }
        matchedData = regex.exec(value);
    }

    if (matches.length === 0) return null;
    return matches;
}

/**
 * A functional version of matchAll
*/
export function matchAllFP(regexp: string | RegExp): (value: string) => string[] | null {
    return matchAll.bind(matchAll, regexp);
}

export function isWildCardString(term: string): boolean {
    if (typeof term !== 'string') return false;
    if (term.includes('*') || term.includes('?')) return true;
    return false;
}

export function wildCardToRegex(term: string): RegExp {
    let baseRegex = '';
    for (let i = 0; i < term.length; i++) {
        const char = term[i];
        if (isEscaped(term, i)) {
            baseRegex += char;
        } else if (char === '*') {
            baseRegex += '.*';
        } else if (char === '?') {
            baseRegex += '[^\\n\\r\\s]';
        } else if (char === ' ') {
            baseRegex += '\\s';
        } else if (char in WORD_CHARS || char === '\\') {
            baseRegex += `${char}`;
        } else {
            baseRegex += `\\${char}`;
        }
    }
    return new RegExp(`^${baseRegex}$`);
}

function isEscaped(input: string, pos: number): boolean {
    if (pos === 0) return false;
    let i = pos;
    let lastCharEscaped = false;
    while (i--) {
        const char = input[i];
        if (char === '\\') {
            lastCharEscaped = !lastCharEscaped;
        } else {
            return lastCharEscaped;
        }
    }
    return lastCharEscaped;
}

export function matchWildcard(wildCard: string, value: string): boolean {
    if (typeof wildCard === 'string' && typeof value === 'string') {
        return wildCardToRegex(wildCard).test(value);
    }
    return false;
}

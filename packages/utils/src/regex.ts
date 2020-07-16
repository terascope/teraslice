export function isRegExp(input: any): input is RegExp {
    if (input instanceof RegExp) return true;
    return typeof input.flags === 'string'
        && typeof input.ignoreCase === 'boolean'
        && typeof input.multiline === 'boolean'
        && typeof input.global === 'boolean';
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

type RegexFlag = 'g'|'i'|'s'|'m'|'x';
function _uniqFlags(existing?: string, flags?: RegexFlag[]): string|undefined {
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
    input: RegExp|string, flags?: RegexFlag[]
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

export function match(regexp: string|RegExp, value: string): string | null {
    if (!isRegExpLike(regexp, false)) return null;

    const regex = formatRegex(regexp);
    const results = regex.exec(String(value));

    if (results) return results[0];
    return results;
}

export function matchAll(regexp: RegExp|string, value: string): string[]|null {
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

export function isWildCardString(term: string): boolean {
    if (typeof term === 'string') {
        if (term.match('[?+*+]')) return true;
    }
    return false;
}

export function wildCardToRegex(term: string): RegExp {
    const baseRegex = term
        .replace('.', '\\.{0,1}')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '[^\\n\\r\\s]');

    return new RegExp(`^${baseRegex}$`);
}

export function matchWildcard(wildCard: string, value: string): boolean {
    if (typeof wildCard === 'string' && typeof value === 'string') {
        const regex = wildCardToRegex(wildCard);
        return value.match(regex) != null;
    }
    return false;
}

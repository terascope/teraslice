/**
 * Converts xLucene wildcard values into SQL `LIKE` patterns.
*/

const LIKE_SPECIAL: ReadonlySet<string> = new Set(['\\', '%', '_']);

/** A character as itself in a `LIKE` pattern. */
function likeLiteral(char: string): string {
    return LIKE_SPECIAL.has(char) ? `\\${char}` : char;
}

/**
 * Convert an xLucene wildcard value to a `LIKE` pattern.
 *
 * `*` and `?` become `%` and `_`. A backslash makes the next character itself, as in
 * Elasticsearch's `wildcard` query, so `Yak\*` is the text `Yak*`. A literal `%`, `_` or `\`
 * in the value is escaped, so the generated SQL always includes `ESCAPE '\'`. Otherwise
 * `bar:100%` would match `100anything`.
*/
export function wildcardToLikePattern(value: string): string {
    let pattern = '';
    for (let index = 0; index < value.length; index++) {
        const char = value[index];
        if (char === '\\' && index + 1 < value.length) {
            index += 1;
            pattern += likeLiteral(value[index]);
        } else if (char === '*') {
            pattern += '%';
        } else if (char === '?') {
            pattern += '_';
        } else {
            pattern += likeLiteral(char);
        }
    }
    return pattern;
}

/**
 * Convert an Elasticsearch (Lucene) regular expression to a POSIX/RE2 one.
 *
 * Lucene has no anchors, the whole value always has to match, so `^` and `$` are the characters
 * themselves: the regexp `^al.*` matches only a value starting with `^al`. Outside a class they
 * are escaped; `[^a]` keeps its meaning, a class that excludes `a`. A backslash still makes the
 * next character itself.
*/
export function luceneRegexpToPattern(value: string): string {
    let pattern = '';
    let inClass = false;
    for (let index = 0; index < value.length; index++) {
        const char = value[index];
        if (char === '\\' && index + 1 < value.length) {
            pattern += char + value[index + 1];
            index += 1;
        } else if (inClass) {
            if (char === ']') inClass = false;
            pattern += char;
        } else if (char === '[') {
            inClass = true;
            pattern += char;
            // `[^` and `[]` start a class, so neither is the end of it or an anchor
            if (value[index + 1] === '^') pattern += value[++index];
            if (value[index + 1] === ']') pattern += value[++index];
        } else if (char === '^' || char === '$') {
            pattern += `\\${char}`;
        } else {
            pattern += char;
        }
    }
    return pattern;
}

/** Whether a wildcard value matches any value, so no pattern match is needed. */
export function isMatchAllWildcard(value: unknown): boolean {
    return value === '*';
}

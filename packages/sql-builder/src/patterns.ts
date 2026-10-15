/**
 * Converts xLucene wildcard values into SQL `LIKE` patterns.
*/

const LIKE_SPECIAL = /[\\%_]/g;

/**
 * Convert an xLucene wildcard value to a `LIKE` pattern.
 *
 * `*` and `?` become `%` and `_`. A literal `%`, `_` or `\` in the value is escaped, so the
 * generated SQL always includes `ESCAPE '\'`. Otherwise `bar:100%` would match `100anything`.
*/
export function wildcardToLikePattern(value: string): string {
    return value
        .replace(LIKE_SPECIAL, (char) => `\\${char}`)
        .replace(/\*/g, '%')
        .replace(/\?/g, '_');
}

/** Whether a wildcard value matches any value, so no pattern match is needed. */
export function isMatchAllWildcard(value: unknown): boolean {
    return value === '*';
}

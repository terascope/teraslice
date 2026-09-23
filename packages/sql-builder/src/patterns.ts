/**
 * Turning an xLucene wildcard value into a SQL `LIKE` pattern.
*/

const LIKE_SPECIAL = /[\\%_]/g;

/**
 * An xLucene wildcard value as a `LIKE` pattern.
 *
 * `*` and `?` become `%` and `_`; a literal `%`, `_` or `\` in the value is escaped, which
 * is why the emission always carries `ESCAPE '\'`. Without the escaping, `bar:100%` would
 * match `100anything` - the value's own `%` would become a wildcard it never was.
*/
export function wildcardToLikePattern(value: string): string {
    return value
        .replace(LIKE_SPECIAL, (char) => `\\${char}`)
        .replace(/\*/g, '%')
        .replace(/\?/g, '_');
}

/** Whether a wildcard value matches anything at all, which needs no pattern match. */
export function isMatchAllWildcard(value: unknown): boolean {
    return value === '*';
}

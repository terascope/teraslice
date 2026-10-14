import {
    TSError, getValidDateOrThrow, isNumber,
    toBoolean, isBooleanLike, isString
} from '@terascope/core-utils';

/**
 * Quoting helpers for SQL that is written the same way in every supported engine:
 * identifiers, string literals, numbers, booleans and timestamps. Anything engine-specific
 * is a method on {@link SQLDialect} instead.
*/

/**
 * Quote an identifier, always.
 *
 * Quoting every identifier means reserved words such as `group`, `order` and `end` work as
 * field names without a reserved-word list.
 *
 * Case handling differs: DuckDB matches quoted identifiers case-insensitively, while
 * PostgreSQL treats them as case-sensitive. A dialect that needs a normalized name should
 * normalize it before calling this.
 *
 * `@terascope/data-types` has its own copy so that it does not depend on a query builder.
*/
export function quoteIdentifier(name: string): string {
    return `"${name.replace(/"/g, '""')}"`;
}

/**
 * Quote a value as a SQL string literal.
 *
 * Doubling single quotes is the only escaping needed. DuckDB and PostgreSQL (with
 * `standard_conforming_strings` on, the default since 9.1) treat a backslash in a
 * single-quoted string as an ordinary character. An engine that does not can override
 * `SQLDialect.stringLiteral`.
 *
 * Do not use `core-utils`' `jsStringEscape` here: it escapes for JavaScript, so it would
 * change `C:\path` and would not escape the single quote.
*/
export function quoteLiteral(value: string): string {
    return `'${value.replace(/'/g, '\'\'')}'`;
}

/**
 * Wrap an expression in parentheses so operator precedence cannot change its meaning.
 *
 * An expression that is already one parenthesized group is left alone, to keep the
 * generated SQL readable.
*/
export function parens(expression: string): string {
    if (isWrapped(expression)) return expression;
    return `(${expression})`;
}

/**
 * Whether the whole expression is one parenthesized group.
 *
 * Parentheses inside string literals are ignored. Otherwise `(a = '(') AND (b = ')')` would
 * look like one group, and a `NOT` applied to it would bind to the first half only.
*/
function isWrapped(expression: string): boolean {
    if (!expression.startsWith('(') || !expression.endsWith(')')) return false;

    let depth = 0;
    let index = 0;

    while (index < expression.length) {
        const char = expression[index];

        if (char === '\'') {
            index = endOfLiteral(expression, index);
            continue;
        }

        if (char === '(') depth += 1;
        if (char === ')') {
            depth -= 1;
            // closed the opening paren before the end, so the group is not the whole thing
            if (depth === 0 && index !== expression.length - 1) return false;
        }

        index += 1;
    }

    return depth === 0;
}

/** The index just past the closing quote of the literal starting at `start`. */
function endOfLiteral(expression: string, start: number): number {
    let index = start + 1;

    while (index < expression.length) {
        if (expression[index] === '\'') {
            // a doubled quote is an escaped one, and the literal continues
            if (expression[index + 1] === '\'') {
                index += 2;
                continue;
            }
            return index + 1;
        }
        index += 1;
    }

    return index;
}

/**
 * A number literal. Throws for `NaN` and `Infinity`, which have no correct SQL equivalent.
*/
export function quoteNumber(value: unknown): string {
    const num = isNumber(value) ? value : Number(value);

    if (!Number.isFinite(num)) {
        throw new TSError(`Cannot translate ${value} to a SQL number`, {
            statusCode: 400,
            context: { safe: true }
        });
    }

    return `${num}`;
}

/**
 * Validate a row count as a non-negative integer.
 *
 * A `LIMIT` cannot be a bound parameter, so the number is written into the statement and is
 * checked to prevent SQL injection.
*/
export function wholeNumber(value: unknown, name: string): number {
    const num = Number(value);

    if (!Number.isSafeInteger(num) || num < 0) {
        throw new TSError(`Expected ${name} to be a non-negative integer, got ${value}`, {
            statusCode: 400,
            context: { safe: true }
        });
    }

    return num;
}

/** A boolean literal. */
export function quoteBoolean(value: unknown): string {
    if (!isBooleanLike(value)) {
        throw new TSError(`Cannot translate ${value} to a SQL boolean`, {
            statusCode: 400,
            context: { safe: true }
        });
    }
    return toBoolean(value) ? 'TRUE' : 'FALSE';
}

/**
 * A date as UTC text, ready to cast to a `TIMESTAMP` without a time zone.
 *
 * DuckDB's `TIMESTAMP` cast drops a time zone offset instead of applying it:
 * `CAST('2020-01-01T00:00:00+02:00' AS TIMESTAMP)` is `2020-01-01 00:00:00`. Converting to
 * UTC first gives the same instant in every engine and server time zone.
*/
export function toUTCTimestampText(value: unknown): string {
    const date = getValidDateOrThrow(value);
    return date.toISOString().replace('T', ' ')
        .replace('Z', '');
}

/**
 * A date as epoch milliseconds, for comparing with the `ms` member of a DuckDB date column
 * (`STRUCT(ms BIGINT, tz_offset SMALLINT)`). Any offset in the value is applied:
 * `'2020-01-01T00:00:00+02:00'` is `1577829600000`.
*/
export function toEpochMillisText(value: unknown): string {
    return String(getValidDateOrThrow(value).getTime());
}

/** A value as the text a SQL literal needs, or a thrown error for something that is not. */
export function toLiteralString(value: unknown): string {
    if (isString(value)) return value;
    if (value == null) {
        throw new TSError('Cannot translate a null value to a SQL literal', {
            statusCode: 400,
            context: { safe: true }
        });
    }
    return String(value);
}

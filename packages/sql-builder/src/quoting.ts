import {
    TSError, getValidDateOrThrow, isNumber,
    toBoolean, isBooleanLike, isString
} from '@terascope/core-utils';

/**
 * Rendering SQL text.
 *
 * What is here is the spelling that is the same in every engine - identifiers, standard
 * string literals, numbers, booleans, timestamps. Anything an engine spells for itself is a
 * method on {@link SQLDialect} instead.
*/

/**
 * Quote an identifier - ALWAYS, not only when it looks unsafe.
 *
 * "When it looks unsafe" is not a decidable test: every RESERVED WORD looks like an ordinary
 * identifier, and `group`, `order`, `end`, `all` and `table` are ordinary field names in real
 * data. An earlier version skipped anything matching `/^[A-Za-z_][A-Za-z0-9_]*$/`, and a field
 * named `group` produced SQL that would not parse. Unconditional quoting needs no reserved-word
 * list to consult and cannot fall behind an engine that adds one.
 *
 * **Case sensitivity differs between engines and this does not paper over it.** DuckDB treats
 * a quoted identifier case-INsensitively (verified: `SELECT "mixedcase"` finds a column
 * declared `"MixedCase"`), where PostgreSQL uses quoting to PIN the case. A dialect whose
 * engine needs the name normalised first should do that before calling this.
 *
 * `data-types` carries its own copy for `toDuckDB`, deliberately - it emits DDL type strings
 * rather than queries, and coupling a type-definition package to a query builder to share one
 * line is the worse trade.
*/
export function quoteIdentifier(name: string): string {
    return `"${name.replace(/"/g, '""')}"`;
}

/**
 * Quote a value as a SQL string literal.
 *
 * **Doubling the quote is the whole escape, and that is deliberate.** Both DuckDB and
 * PostgreSQL (with `standard_conforming_strings` on, its default since 9.1) treat a backslash
 * inside a single-quoted string as an ordinary character, so there is no second escape
 * sequence to defeat. An engine that says otherwise needs its own implementation - which is
 * why `SQLDialect.stringLiteral` is overridable.
 *
 * **Not the same job as `core-utils`' `jsStringEscape`**, which escapes for a JAVASCRIPT
 * string literal: it escapes backslashes, which would corrupt `C:\path` here while still not
 * escaping the quote that matters.
*/
export function quoteLiteral(value: string): string {
    return `'${value.replace(/'/g, '\'\'')}'`;
}

/**
 * Wrap an expression so it is safe to inline wherever operator precedence could bite.
 *
 * An expression that is ALREADY one parenthesized group is left alone - the emitted SQL is
 * read by people, and `((((a) OR (b))))` costs nothing to run and a lot to read.
*/
export function parens(expression: string): string {
    if (isWrapped(expression)) return expression;
    return `(${expression})`;
}

/**
 * Whether the whole expression is one parenthesized group.
 *
 * **String literals are skipped, and that is not tidiness.** A value of `'('` would otherwise
 * raise the depth and make `(a = '(') AND (b = ')')` look like a single group - so it would
 * not be wrapped, and `NOT` applied to it would bind to the first half alone. Since every
 * literal this module emits is single-quoted with `''` for an embedded quote, the scan knows
 * exactly where a literal starts and ends.
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
 * A number literal, or a thrown error.
 *
 * `NaN` and `Infinity` have no SQL spelling that means what they mean here, and emitting
 * the JavaScript text of either produces a query that parses and then answers wrongly.
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
 * A count of rows, which is a non-negative integer or nothing.
 *
 * A `LIMIT` cannot be parameterised the way a value can, so the number is written into the
 * statement - which makes checking it the difference between a limit and an injection point.
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
 * A date as UTC wall-clock text, ready to cast to a naive `TIMESTAMP`.
 *
 * **Measured: DuckDB's `TIMESTAMP` cast DROPS the zone rather than applying it** -
 * `CAST('2020-01-01T00:00:00+02:00' AS TIMESTAMP)` is `2020-01-01 00:00:00`, not
 * `2019-12-31 22:00:00`. A `date` column holds UTC instants, so leaving the offset in the
 * literal would silently compare the wrong instant. Normalising to UTC here means the
 * literal says the same thing in every engine and in every server timezone.
*/
export function toUTCTimestampText(value: unknown): string {
    const date = getValidDateOrThrow(value);
    return date.toISOString().replace('T', ' ')
        .replace('Z', '');
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

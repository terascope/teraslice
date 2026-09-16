import {
    TSError, getValidDateOrThrow, isNumber,
    toBoolean, isBooleanLike, isString,
    getValidDate
} from '@terascope/core-utils';
import { parseGeoPoint } from '@terascope/geo-utils';
import { isCIDR, isIP } from '@terascope/ip-utils';
import { xLuceneFieldType } from '@terascope/types';

/**
 * Rendering helpers shared by every dialect.
 *
 * What is here is the SQL that is the SAME everywhere - standard string literals, the
 * wildcard-to-`LIKE` translation, number and date rendering. Anything an engine spells
 * differently lives on the dialect itself.
*/

/**
 * A SQL string literal.
 *
 * **Doubling the quote is the whole escape, and that is deliberate.** Both DuckDB and
 * PostgreSQL (with `standard_conforming_strings` on, the default since 9.1) treat a
 * backslash inside a single-quoted string as an ordinary character, so there is no second
 * escape sequence to defeat. A dialect whose engine says otherwise overrides
 * `stringLiteral`.
*/
export function quoteLiteral(value: string): string {
    return `'${value.replace(/'/g, '\'\'')}'`;
}

/**
 * A quoted identifier.
 *
 * Quoting is unconditional rather than "when it looks unsafe", because every RESERVED WORD
 * looks safe: a field named `group`, `order`, `end` or `table` is an ordinary field name in
 * real data and a parser error unquoted.
*/
export function quoteIdentifier(name: string): string {
    return `"${name.replace(/"/g, '""')}"`;
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

const NUMERIC_TYPES: readonly xLuceneFieldType[] = [
    xLuceneFieldType.Integer,
    xLuceneFieldType.Float,
    xLuceneFieldType.Number,
];

const TEXT_TYPES: readonly xLuceneFieldType[] = [
    xLuceneFieldType.String,
    xLuceneFieldType.AnalyzedString,
    xLuceneFieldType.IP,
    xLuceneFieldType.IPRange,
];

export function isNumericFieldType(fieldType?: xLuceneFieldType): boolean {
    return fieldType != null && NUMERIC_TYPES.includes(fieldType);
}

export function isTextFieldType(fieldType?: xLuceneFieldType): boolean {
    return fieldType != null && TEXT_TYPES.includes(fieldType);
}

/**
 * The field type to render a value as when the node carries none.
 *
 * A term built from an array variable has no `field_type` at all (measured - the parser
 * expands `some:$array` into a field group whose terms carry only a value), so the value's
 * own JavaScript type is the only thing left to go on.
*/
export function inferFieldType(value: unknown): xLuceneFieldType {
    if (typeof value === 'boolean') return xLuceneFieldType.Boolean;
    if (isNumber(value)) return xLuceneFieldType.Number;
    return xLuceneFieldType.String;
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

/**
 * Whether a value could be a value of this field type at all.
 *
 * **This is only asked when a query names no field, or names a pattern of them** - a query
 * that names its field has already been coerced by the parser, which throws on a value the
 * type cannot hold. An expansion has no such protection: `ba*:hello` can land on an integer
 * column, where `"num" = 'hello'` is not a non-match but a cast error that fails the whole
 * query.
 *
 * A field this returns false for contributes nothing to the expansion, which is the same
 * answer Elasticsearch gives - it simply cannot match.
*/
export function canRenderValueAs(value: unknown, fieldType?: xLuceneFieldType): boolean {
    if (value == null) return false;

    switch (fieldType) {
        case xLuceneFieldType.Integer:
        case xLuceneFieldType.Float:
        case xLuceneFieldType.Number:
            return isNumber(value) || (isString(value) && value !== '' && Number.isFinite(Number(value)));
        case xLuceneFieldType.Boolean:
            return isBooleanLike(value);
        case xLuceneFieldType.Date:
            return getValidDate(value) !== false;
        case xLuceneFieldType.IP:
        case xLuceneFieldType.IPRange:
            return isIP(value) || isCIDR(value);
        case xLuceneFieldType.Geo:
        case xLuceneFieldType.GeoPoint:
            return parseGeoPoint(value, false) != null;
        case xLuceneFieldType.GeoJSON:
        case xLuceneFieldType.Object:
            return false;
        default:
            return true;
    }
}

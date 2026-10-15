import 'jest-extended';
import {
    parens, quoteBoolean, quoteIdentifier, quoteLiteral,
    quoteNumber, toLiteralString, toUTCTimestampText, wholeNumber
} from '../src/index.js';

describe('quoting', () => {
    /**
     * Identifiers are always quoted. A "safe identifier" pattern would also match reserved
     * words, so a field named `group` would produce SQL that does not parse.
    */
    describe('->quoteIdentifier', () => {
        it.each(['group', 'order', 'end', 'all', 'table', 'select'])(
            'quotes the reserved word %s', (name) => {
                expect(quoteIdentifier(name)).toBe(`"${name}"`);
            }
        );

        it('quotes an ordinary name too, rather than deciding', () => {
            expect(quoteIdentifier('bytes')).toBe('"bytes"');
        });

        it('escapes an embedded double quote by doubling it', () => {
            expect(quoteIdentifier('we"ird')).toBe('"we""ird"');
        });

        it('quotes a tuple position, which is a legal DataType field name', () => {
            expect(quoteIdentifier('0')).toBe('"0"');
        });
    });

    describe('->quoteLiteral', () => {
        it('wraps a value in single quotes', () => {
            expect(quoteLiteral('hello')).toBe('\'hello\'');
        });

        /**
         * Doubling the quote is the only escape needed. DuckDB and PostgreSQL (with
         * `standard_conforming_strings` on) treat a backslash as an ordinary character.
        */
        it('escapes an embedded single quote by doubling it', () => {
            expect(quoteLiteral('O\'Brien')).toBe('\'O\'\'Brien\'');
        });

        it('leaves a backslash alone, because it is not an escape in either engine', () => {
            expect(quoteLiteral('a\\b')).toBe('\'a\\b\'');
        });

        it('does not let a quote close the literal early', () => {
            expect(quoteLiteral('\'; DROP TABLE users; --')).toBe('\'\'\'; DROP TABLE users; --\'');
        });
    });

    describe('->parens', () => {
        it('wraps an expression that is not already one group', () => {
            expect(parens('a = 1 OR b = 2')).toBe('(a = 1 OR b = 2)');
        });

        it('leaves an expression that is already one group, so the SQL stays readable', () => {
            expect(parens('(a = 1)')).toBe('(a = 1)');
        });

        it('wraps two adjacent groups, which are not one group', () => {
            expect(parens('(a = 1) AND (b = 2)')).toBe('((a = 1) AND (b = 2))');
        });

        /**
         * A `(` inside a literal must not count toward the depth. If it did, two groups would
         * look like one and a `NOT` applied to the result would bind to the first half only.
        */
        it('does not count a paren inside a string literal', () => {
            expect(parens('(a = \'(\') AND (b = \')\')')).toBe('((a = \'(\') AND (b = \')\'))');
        });
    });

    describe('->quoteNumber', () => {
        it.each([[1, '1'], [-2.5, '-2.5'], ['3', '3']])('renders %p as %s', (input, expected) => {
            expect(quoteNumber(input)).toBe(expected);
        });

        it.each([Number.NaN, Number.POSITIVE_INFINITY, 'nope'])(
            'refuses %p, which has no SQL spelling that means what it means here', (input) => {
                expect(() => quoteNumber(input)).toThrow('Cannot translate');
            }
        );
    });

    describe('->wholeNumber', () => {
        it('accepts a non-negative integer', () => {
            expect(wholeNumber(0, 'size')).toBe(0);
            expect(wholeNumber(10, 'size')).toBe(10);
        });

        it.each([-1, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 2])(
            'refuses %p, naming the argument it was given for', (input) => {
                expect(() => wholeNumber(input, 'size'))
                    .toThrow('Expected size to be a non-negative integer');
            }
        );
    });

    describe('->quoteBoolean', () => {
        it.each([[true, 'TRUE'], [false, 'FALSE'], ['true', 'TRUE']])(
            'renders %p as %s', (input, expected) => {
                expect(quoteBoolean(input)).toBe(expected);
            }
        );

        it('refuses something that is not boolean-like', () => {
            expect(() => quoteBoolean('maybe')).toThrow('Cannot translate');
        });
    });

    /**
     * DuckDB's `TIMESTAMP` cast drops the zone instead of applying it, so an offset left in
     * the literal would compare a different instant.
    */
    describe('->toUTCTimestampText', () => {
        it('normalizes an offset to UTC wall-clock text', () => {
            expect(toUTCTimestampText('2020-01-01T00:00:00+02:00')).toBe('2019-12-31 22:00:00.000');
        });

        it('leaves an already-UTC instant alone', () => {
            expect(toUTCTimestampText('2020-01-01T00:00:00.000Z')).toBe('2020-01-01 00:00:00.000');
        });
    });

    describe('->toLiteralString', () => {
        it('passes a string through', () => {
            expect(toLiteralString('hi')).toBe('hi');
        });

        it('stringifies a number', () => {
            expect(toLiteralString(5)).toBe('5');
        });

        it('refuses null, which is not a literal', () => {
            expect(() => toLiteralString(null)).toThrow('Cannot translate a null value');
        });
    });
});

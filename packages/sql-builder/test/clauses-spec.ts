import 'jest-extended';
import { SQLSort } from '@terascope/types';
import {
    defaultNullOrder, groupByClause, orderByClause,
    orderByTerms, sortDirection, toSQLSort
} from '../src/index.js';

/**
 * The clause builder, which is the one place null placement is decided.
 *
 * These are the tests that stop the two packages drifting apart again: before this existed,
 * `xlucene-translator` emitted `x ASC` and let DuckDB's `NULLS LAST` default stand, while
 * `data-mate`'s frame emitted `x ASC NULLS FIRST`.
*/
describe('clauses', () => {
    describe('->sortDirection', () => {
        it.each([
            ['asc', 'ASC'],
            ['desc', 'DESC'],
            ['ASC', 'ASC'],
            ['DeSc', 'DESC'],
        ])('accepts %s in any case', (input, expected) => {
            expect(sortDirection(input)).toBe(expected);
        });

        it.each([
            ['an unknown direction', 'sideways'],
            ['a direction carrying more SQL', 'asc, (SELECT 1)'],
            ['an empty direction', ''],
            ['no direction at all', undefined],
            ['a number', 1],
        ])('refuses %s', (_label, input) => {
            expect(() => sortDirection(input)).toThrow('Expected a sort order of asc or desc');
        });
    });

    /**
     * **`DataFrame`'s rule, which agrees with no engine's default**, so it is always spelled
     * out rather than left to one. `Vector.compare` treats a nil as the smallest value.
    */
    describe('->defaultNullOrder', () => {
        it('puts nulls first ascending, which is where the smallest value goes', () => {
            expect(defaultNullOrder('ASC')).toBe('first');
        });

        it('puts nulls last descending', () => {
            expect(defaultNullOrder('DESC')).toBe('last');
        });
    });

    describe('->orderByTerms', () => {
        it('emits the direction AND the null placement on every term', () => {
            expect(orderByTerms([{ expression: '"bytes"', order: 'asc' }]))
                .toBe('"bytes" ASC NULLS FIRST');
        });

        it('emits nulls last for a descending sort', () => {
            expect(orderByTerms([{ expression: '"bytes"', order: 'desc' }]))
                .toBe('"bytes" DESC NULLS LAST');
        });

        /**
         * The REGRESSION this file exists for: the null default is taken from the NORMALISED
         * direction. Reading the raw value made `'DESC'` - a legal spelling - fall through to
         * the ascending branch and sort its nulls at the wrong end.
        */
        it('uses the normalised direction to place nulls, not the raw value', () => {
            expect(orderByTerms([{ expression: '"bytes"', order: 'DESC' as never }]))
                .toBe('"bytes" DESC NULLS LAST');
        });

        it('lets a caller ask for the Elasticsearch answer instead', () => {
            expect(orderByTerms([{ expression: '"bytes"', order: 'asc', nulls: 'last' }]))
                .toBe('"bytes" ASC NULLS LAST');
        });

        it('joins several terms in order', () => {
            const sort: SQLSort[] = [
                { expression: '"a"', order: 'asc' },
                { expression: 'date_trunc(\'day\', "ts")', order: 'desc' },
            ];

            expect(orderByTerms(sort))
                .toBe('"a" ASC NULLS FIRST, date_trunc(\'day\', "ts") DESC NULLS LAST');
        });

        it('uses the expression verbatim, because it is the caller\'s own SQL', () => {
            const distance = 'ST_Distance_Sphere(ST_Point(1, 2), ST_Point(3, 4))';

            expect(orderByTerms([{ expression: distance, order: 'asc' }]))
                .toStartWith(distance);
        });

        it.each([[undefined], [[]]])('emits nothing for %p', (sort) => {
            expect(orderByTerms(sort as never)).toBe('');
        });

        it('refuses a term with no expression', () => {
            expect(() => orderByTerms([{ expression: '', order: 'asc' }]))
                .toThrow('An ORDER BY term requires an expression');
        });

        it('refuses a null order that is neither first nor last', () => {
            expect(() => orderByTerms([{ expression: '"a"', order: 'asc', nulls: 'middle' as never }]))
                .toThrow('Expected a null order of first or last, got middle');
        });
    });

    describe('->orderByClause', () => {
        it('carries the keyword when there is an ordering', () => {
            expect(orderByClause([{ expression: '"a"', order: 'asc' }]))
                .toBe('ORDER BY "a" ASC NULLS FIRST');
        });

        it('is empty when there is not, so it can be concatenated unconditionally', () => {
            expect(orderByClause([])).toBe('');
        });
    });

    /**
     * The frame's own API defaults to ascending; `SQLSort` does not, because it is built from
     * request data where a missing direction is a bug rather than a shorthand.
    */
    describe('->toSQLSort', () => {
        it('defaults the direction to ascending', () => {
            expect(toSQLSort({ expression: '"a"' })).toEqual({ expression: '"a"', order: 'asc' });
        });

        it('leaves a direction that was given', () => {
            expect(toSQLSort({ expression: '"a"', order: 'desc' }))
                .toEqual({ expression: '"a"', order: 'desc' });
        });

        it('carries a null placement through', () => {
            expect(toSQLSort({ expression: '"a"', nulls: 'last' }))
                .toEqual({ expression: '"a"', order: 'asc', nulls: 'last' });
        });
    });

    describe('->groupByClause', () => {
        it('uses each expression verbatim', () => {
            expect(groupByClause(['"a"', 'date_trunc(\'day\', "ts")']))
                .toBe('GROUP BY "a", date_trunc(\'day\', "ts")');
        });

        it.each([[undefined], [[]]])('is empty for %p', (groupBy) => {
            expect(groupByClause(groupBy as never)).toBe('');
        });
    });
});

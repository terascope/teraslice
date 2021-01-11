/* eslint-disable no-template-curly-in-string */
import 'jest-extended';
import { transform } from '../src';

describe('transform', () => {
    describe('when given non-templated string', () => {
        it('should return the original string', () => {
            expect(transform('foo:bar', { variables: { } })).toBe('foo:bar');
        });
    });

    describe('when given single expression string', () => {
        it('should return the valuated string', () => {
            expect(transform('${foo_var}', {
                variables: {
                    foo_var: 'foo'
                }
            })).toBe('foo');
        });
    });

    describe('when given multiple expression string', () => {
        it('should return the valuated string', () => {
            expect(transform('${foo_var} OR ${bar_var} AND foo:${foo_var}', {
                variables: {
                    foo_var: 'foo',
                    bar_var: 'bar',
                }
            })).toBe('foo OR bar AND foo:foo');
        });
    });
});

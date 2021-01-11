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

    describe('when given a simple escaped expression string', () => {
        it('should not evaluate the expression with \\$', () => {
            expect(transform('\\${foo_var}', {
                variables: {}
            })).toBe('\\${foo_var}');
        });

        it('should not evaluate the expression with \\}', () => {
            expect(transform('${foo_var\\}', {
                variables: {}
            })).toBe('${foo_var\\}');
        });

        it('should not evaluate the expression with \\{', () => {
            expect(transform('$\\{foo_var}', {
                variables: {}
            })).toBe('$\\{foo_var}');
        });

        it('should not evaluate the expression with escaped everywhere', () => {
            expect(transform('\\$\\{foo_var\\}', {
                variables: {}
            })).toBe('\\$\\{foo_var\\}');
        });
    });
});

import 'jest-extended';
import { transform } from '../src/index.js';

describe('transform', () => {
    describe('when given non-templated string', () => {
        it('should return the original string', () => {
            expect(transform('foo:bar', { variables: { } })).toBe('foo:bar');
        });
    });

    describe('when given single expression string', () => {
        it('should return the evaluated string', () => {
            expect(transform('${foo_var}', {
                variables: {
                    foo_var: 'foo'
                }
            })).toBe('foo');
        });
    });

    describe('when given single expression string with a scoped variable', () => {
        it('should return the evaluated string', () => {
            expect(transform('${@foo_var}', {
                variables: {
                    '@foo_var': 'foo'
                }
            })).toBe('foo');
        });
    });

    describe('when given a expression with whitespace', () => {
        it('should return ignore the whitespace in the expression but any other whitespace', () => {
            expect(transform(' ${  foo_var  } ', {
                variables: {
                    foo_var: 'foo'
                }
            })).toBe(' foo ');
        });
    });

    describe('when given a expression with an unknown variable', () => {
        it('should throw an error', () => {
            expect(() => {
                transform('${foo_var2}', {
                    variables: {
                        foo_var: 'foo'
                    }
                });
            }).toThrow('Missing variable "foo_var2" in expression');
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

        it('should throw when evaluating the expression with \\}', () => {
            expect(() => {
                transform('${foo_var\\}', {
                    variables: {}
                });
            }).toThrow('Expected } for end of expression, found EOL');
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

    describe('when given a double escaped expression string', () => {
        it('should evaluate the expression and return the escape', () => {
            expect(transform('\\\\${foo_var}', {
                variables: { foo_var: 'foo' }
            })).toBe('\\\\foo');
        });
    });
});

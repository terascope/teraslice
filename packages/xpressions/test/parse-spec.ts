/* eslint-disable no-template-curly-in-string */
import 'jest-extended';
import { NodeType, parse } from '../src';

describe('parse', () => {
    describe('when given non-templated string', () => {
        it('should return the original string', () => {
            expect(parse('foo:bar', { variables: { } })).toEqual([{
                type: NodeType.LITERAL,
                value: 'foo:bar'
            }]);
        });
    });

    describe('when given single expression string', () => {
        it('should return the valuated string', () => {
            expect(parse('${foo_var}', {
                variables: {
                    foo_var: 'foo'
                }
            })).toEqual([{
                type: NodeType.EXPRESSION,
                value: 'foo_var',
                variables: [{
                    scoped: false,
                    value: 'foo_var'
                }]
            }]);
        });
    });

    describe('when given scoped variable expression', () => {
        it('should return the valuated string', () => {
            expect(parse('${@foo_var}', {
                variables: {
                    '@foo_var': 'foo'
                }
            })).toEqual([{
                type: NodeType.EXPRESSION,
                value: '@foo_var',
                variables: [{
                    scoped: true,
                    value: '@foo_var'
                }]
            }]);
        });
    });

    describe('when given multiple expression string', () => {
        it('should return the valuated string', () => {
            expect(parse('${foo_var} OR ${bar_var} AND foo:${foo_var}', {
                variables: {
                    foo_var: 'foo',
                    bar_var: 'bar',
                }
            })).toEqual([{
                type: NodeType.EXPRESSION,
                value: 'foo_var',
                variables: [{
                    scoped: false,
                    value: 'foo_var'
                }]
            }, {
                type: NodeType.LITERAL,
                value: ' OR ',
            }, {
                type: NodeType.EXPRESSION,
                value: 'bar_var',
                variables: [{
                    scoped: false,
                    value: 'bar_var'
                }]
            }, {
                type: NodeType.LITERAL,
                value: ' AND foo:'
            }, {
                type: NodeType.EXPRESSION,
                value: 'foo_var',
                variables: [{
                    scoped: false,
                    value: 'foo_var'
                }]
            }]);
        });
    });

    describe('when given a simple escaped expression string', () => {
        it('should not evaluate the expression with \\$', () => {
            expect(parse('\\${foo_var}', {
                variables: {}
            })).toEqual([{
                type: NodeType.LITERAL,
                value: '\\${foo_var}'
            }]);
        });

        it('should not evaluate the expression with \\}', () => {
            expect(parse('${foo_var\\}', {
                variables: {}
            })).toEqual([{
                type: NodeType.LITERAL,
                value: '${foo_var\\}'
            }]);
        });

        it('should not evaluate the expression with \\{', () => {
            expect(parse('$\\{foo_var}', {
                variables: {}
            })).toEqual([{
                type: NodeType.LITERAL,
                value: '$\\{foo_var}'
            }]);
        });

        it('should not evaluate the expression with escaped everywhere', () => {
            expect(parse('\\$\\{foo_var\\}', {
                variables: {}
            })).toEqual([{
                type: NodeType.LITERAL,
                value: '\\$\\{foo_var\\}'
            }]);
        });
    });

    describe('when given a double escaped expression string', () => {
        it('should evaluate the expression and return the escape', () => {
            expect(parse('\\\\${foo_var}', {
                variables: { foo_var: 'foo' }
            })).toEqual([{
                type: NodeType.LITERAL,
                value: '\\\\'
            }, {
                type: NodeType.EXPRESSION,
                value: 'foo_var',
                variables: [{
                    scoped: false,
                    value: 'foo_var'
                }]
            }]);
        });
    });
});

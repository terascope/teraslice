import 'jest-extended';
import { NodeType, parse } from '../src/index.js';

describe('parse', () => {
    describe('when given non-templated string', () => {
        it('should return the original string', () => {
            expect(parse('foo:bar')).toEqual([{
                type: NodeType.LITERAL,
                value: 'foo:bar',
                loc: {
                    start: 0,
                    end: 7
                }
            }]);
        });
    });

    describe('when given single expression string', () => {
        it('should return the valuated string', () => {
            expect(parse('${foo_var}')).toEqual([{
                type: NodeType.EXPRESSION,
                value: 'foo_var',
                nodes: [{
                    type: NodeType.VARIABLE,
                    scoped: false,
                    value: 'foo_var',
                    loc: {
                        start: 2,
                        end: 9
                    }
                }],
                loc: {
                    start: 2,
                    end: 9
                }
            }]);
        });
    });

    describe('when given single expression string with a dollar sign', () => {
        it('should return the valuated string', () => {
            expect(parse('${$foo_var}')).toEqual([{
                type: NodeType.EXPRESSION,
                value: '$foo_var',
                nodes: [{
                    type: NodeType.VARIABLE,
                    scoped: false,
                    value: 'foo_var',
                    loc: {
                        start: 2,
                        end: 10
                    }
                }],
                loc: {
                    start: 2,
                    end: 10
                }
            }]);
        });
    });

    describe('when given scoped variable expression', () => {
        it('should return the valuated string', () => {
            expect(parse('${@foo_var}')).toEqual([{
                type: NodeType.EXPRESSION,
                value: '@foo_var',
                nodes: [{
                    type: NodeType.VARIABLE,
                    scoped: true,
                    value: '@foo_var',
                    loc: {
                        start: 2,
                        end: 10
                    }
                }],
                loc: {
                    start: 2,
                    end: 10
                }
            }]);
        });
    });

    describe('when given multiple expression string', () => {
        it('should return the valuated string', () => {
            expect(parse('${foo_var} OR ${bar_var} AND foo:${foo_var}')).toEqual([{
                type: NodeType.EXPRESSION,
                value: 'foo_var',
                nodes: [{
                    type: NodeType.VARIABLE,
                    scoped: false,
                    value: 'foo_var',
                    loc: {
                        start: 2,
                        end: 9
                    }
                }],
                loc: {
                    start: 2,
                    end: 9
                }
            },
            {
                type: NodeType.LITERAL,
                value: ' OR ',
                loc: {
                    start: 9,
                    end: 14
                }
            },
            {
                type: NodeType.EXPRESSION,
                value: 'bar_var',
                nodes: [{
                    type: NodeType.VARIABLE,
                    scoped: false,
                    value: 'bar_var',
                    loc: {
                        start: 16,
                        end: 23
                    }
                }],
                loc: {
                    start: 16,
                    end: 23
                }
            },
            {
                type: NodeType.LITERAL,
                value: ' AND foo:',
                loc: {
                    start: 23,
                    end: 33
                }
            },
            {
                type: NodeType.EXPRESSION,
                value: 'foo_var',
                nodes: [{
                    type: NodeType.VARIABLE,
                    scoped: false,
                    value: 'foo_var',
                    loc: {
                        start: 35,
                        end: 42
                    }
                }],
                loc: {
                    start: 35,
                    end: 42
                }
            }]);
        });
    });

    describe('when given a simple escaped expression string', () => {
        it('should not evaluate the expression with \\$', () => {
            expect(parse('\\${foo_var}')).toEqual([{
                type: NodeType.LITERAL,
                value: '\\${foo_var}',
                loc: {
                    start: 0,
                    end: 11
                }
            }]);
        });

        it('should throw when given expression with \\}', () => {
            expect(() => {
                parse('${foo_var\\}');
            }).toThrow('Expected } for end of expression, found EOL');
        });

        it('should not evaluate the expression with \\{', () => {
            expect(parse('$\\{foo_var}')).toEqual([{
                type: NodeType.LITERAL,
                value: '$\\{foo_var}',
                loc: {
                    start: 0,
                    end: 11
                }
            }]);
        });

        it('should not evaluate the expression with escaped everywhere', () => {
            expect(parse('\\$\\{foo_var\\}')).toEqual([{
                type: NodeType.LITERAL,
                value: '\\$\\{foo_var\\}',
                loc: {
                    start: 0,
                    end: 13
                }
            }]);
        });
    });

    describe('when given a double escaped expression string', () => {
        it('should evaluate the expression and return the escape', () => {
            expect(parse('\\\\${foo_var}')).toEqual([{
                type: NodeType.LITERAL,
                value: '\\\\',
                loc: {
                    start: 0,
                    end: 2
                }
            },
            {
                type: NodeType.EXPRESSION,
                value: 'foo_var',
                nodes: [{
                    type: NodeType.VARIABLE,
                    scoped: false,
                    value: 'foo_var',
                    loc: {
                        start: 4,
                        end: 11
                    }
                }],
                loc: {
                    start: 4,
                    end: 11
                }
            }]);
        });
    });
});

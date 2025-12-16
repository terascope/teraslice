import 'jest-extended';
import { TSError, times, toString } from '@terascope/core-utils';
import { xLuceneFieldType } from '@terascope/types';
import allTestCases, { filterNilTestCases } from './cases/index.js';
import {
    Parser, NodeType, FieldValue, TermLikeNode
} from '../src';

describe('Parser', () => {
    for (const [key, testCases] of Object.entries(allTestCases)) {
        describe(`when testing ${key.replace('_', ' ')} queries`, () => {
            describe.each(testCases)('given query %s', (query, msg, ast, typeConfig, variables, resolved, testDatesFn) => {
                if (variables) {
                    it(`should be able to parse ${msg} with variables ${toString(variables)}`, () => {
                        const now = new Date();
                        const parser = new Parser(query, {
                            type_config: typeConfig,
                            variables
                        });

                        if (testDatesFn) {
                            testDatesFn(now, parser.ast);
                        }
                        expect(parser.ast).toMatchObject(ast);
                    });
                } else {
                    it(`should be able to parse ${msg}`, () => {
                        const now = new Date();
                        const parser = new Parser(query, {
                            type_config: typeConfig,
                        });

                        if (testDatesFn) {
                            testDatesFn(now, parser.ast);
                        }
                        expect(parser.ast).toMatchObject(ast);
                    });
                }
            });
        });
    }

    describe('when parser has filterNilVariables set true', () => {
        for (const [key, testCases] of Object.entries(filterNilTestCases)) {
            describe(`when testing ${key.replace('_', ' ')} queries`, () => {
                describe.each(testCases)('given query %s', (query, msg, ast, typeConfig, variables, resolved) => {
                    it(`should be able to parse ${msg} ${variables ? `with variables ${toString(variables)}` : ''}`, () => {
                        const parser = new Parser(query, {
                            type_config: typeConfig,
                            filterNilVariables: true,
                            instantiateVariableValues: false,
                            variables
                        });

                        expect(parser.ast).toMatchObject(ast);
                    });

                    if (variables && resolved) {
                        it(`should be able to resolve variables ${toString(variables)}`, () => {
                            const parser = new Parser(query, {
                                type_config: typeConfig,
                                filterNilVariables: true,
                                variables
                            });

                            expect(parser.ast).toMatchObject(resolved);
                        });
                    }
                });
            });
        }
    });

    describe('when testing edge cases', () => {
        describe('given a gigantic query', () => {
            it('should be able to parse it', () => {
                const partOne = times(300, (n) => `a:${n}`).join(' OR ');
                const partTwo = times(200, (n) => `b:${n}`).join(' OR ');
                const partThree = times(500, (n) => `c:${n}`).join(') OR (');
                const parser = new Parser(`(${partOne}) AND ${partTwo} OR (${partThree})`);
                expect(parser.ast).toMatchObject({
                    type: NodeType.LogicalGroup,
                });
            });
        });
    });

    describe('when given a invalid query "(ba"', () => {
        it('should throw an error', () => {
            const errMsg = [
                'Failure to parse xLucene query "(ba",',
                'caused by SyntaxError: Expected ")", field, term, or whitespace but end of input found.',
            ].join(' ');

            expect(() => {
                new Parser('(ba');
            }).toThrowWithMessage(TSError, errMsg);
        });
    });

    describe('when given a invalid query "AND foo:bar"', () => {
        it('should throw an error', () => {
            const errMsg = 'Failure to parse xLucene query "AND foo:bar", caused by SyntaxError: Expected term, or whitespace but ":" found.';
            expect(() => {
                new Parser('AND foo:bar');
            }).toThrowWithMessage(TSError, errMsg);
        });
    });

    describe('when given a invalid query "OR foo:bar"', () => {
        it('should throw an error', () => {
            const errMsg = 'Failure to parse xLucene query "OR foo:bar", caused by SyntaxError: Expected term, or whitespace but ":" found.';
            expect(() => {
                new Parser('OR foo:bar');
            }).toThrowWithMessage(TSError, errMsg);
        });
    });

    describe('when given a invalid scoped query', () => {
        it('should throw if there are multiple dots', () => {
            expect(() => {
                new Parser('foo:@bar..baz');
            }).toThrow();
        });

        it('should throw an error if it is combined with $', () => {
            expect(() => {
                new Parser('foo:$@bar');
            }).toThrow();
        });

        it('should throw an error if it is combined with $ and @ is escaped', () => {
            expect(() => {
                new Parser('field:$\\@example');
            }).toThrow();
        });
    });

    it('should be to iterate over all of the values', () => {
        const parser = new Parser([
            'a:$foo',
            'b:>=20',
            'a:($foo @bar)',
            'geo:geoBox(top_left:" 33.906320, -112.758421", bottom_right:$bottom_right)',
        ].join(' AND '), {
            type_config: {
                a: xLuceneFieldType.Integer,
                b: xLuceneFieldType.Integer,
                geo: xLuceneFieldType.GeoPoint,
            },
        });

        const nodes: [FieldValue<any>, TermLikeNode][] = [];
        parser.forEachFieldValue((value, node) => nodes.push([value, node]));
        expect(nodes).toMatchSnapshot();
    });

    test.each([
        { some: 'data' },
        Buffer.from('1234'),
        new Map(),
        new Set(),
        new Error(),
        [1, { other: 'stuff' }, 3]
    ])('should throw if given invalid variable value %p', (value) => {
        const query = 'foo: $bar';
        const typeConfig = { foo: xLuceneFieldType.String };

        const variables = { bar: value };

        expect(() => {
            new Parser(query, {
                type_config: typeConfig,
                variables
            });
        }).toThrow();
    });
});

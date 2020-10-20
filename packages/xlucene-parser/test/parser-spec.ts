import 'jest-extended';
import { TSError, times } from '@terascope/utils';
import { xLuceneFieldType } from '@terascope/types';
import allTestCases from './cases';
import { Parser, ASTType } from '../src';

describe('Parser', () => {
    for (const [key, testCases] of Object.entries(allTestCases)) {
        describe(`when testing ${key.replace('_', ' ')} queries`, () => {
            describe.each(testCases)('given query %s', (query, msg, ast, typeConfig, variables) => {
                it(`should be able to parse ${msg}`, () => {
                    const parser = new Parser(query, {
                        type_config: typeConfig,
                        variables
                    });
                    expect(parser.ast).toMatchObject(ast);
                });
            });
        });
    }

    describe('when testing edge cases', () => {
        describe('given a gigantic query', () => {
            it('should be able to parse it', () => {
                const partOne = times(300, (n) => `a:${n}`).join(' OR ');
                const partTwo = times(200, (n) => `b:${n}`).join(' OR ');
                const partThree = times(500, (n) => `c:${n}`).join(') OR (');
                const parser = new Parser(`(${partOne}) AND ${partTwo} OR (${partThree})`);
                expect(parser.ast).toMatchObject({
                    type: ASTType.LogicalGroup,
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

    describe('when given variables in a query', () => {
        it('should not throw an error if no variables are supplied', () => {
            const errMsg = /Could not find a variable set with key "bar"/;
            expect(() => {
                new Parser('foo:$bar');
            }).not.toThrowWithMessage(TSError, errMsg);
        });

        it('should not throw an error if a variable value is an object if the field name is not part of a function expression', () => {
            expect(() => {
                new Parser('foo:$bar', {
                    variables: {
                        bar: { some: 'value' },
                        other: 'variable'
                    }
                });
            }).not.toThrow();
        });
    });

    it('should not throw if given invalid variable values', () => {
        const query = 'foo: $bar';
        const typeConfig = { foo: xLuceneFieldType.String };

        function test(val: any) {
            const variables = { bar: val };

            expect(() => {
                new Parser(query, {
                    type_config: typeConfig,
                    variables
                });
            }).not.toThrow();
        }

        const testCases: any[] = [
            { some: 'data' },
            Buffer.from('1234'),
            new Map(),
            new Set(),
            new Error(),
            [1, { other: 'stuff' }, 3]
        ];

        testCases.forEach(test);
    });
});

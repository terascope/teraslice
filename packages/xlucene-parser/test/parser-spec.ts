import 'jest-extended';
import { TSError, times } from '@terascope/utils';
import { xLuceneFieldType } from '@terascope/types';
import allTestCases from './cases/parser';
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
                'Failure to parse xlucene query "(ba",',
                'caused by SyntaxError: Expected ")", field, term, or whitespace but end of input found.',
            ].join(' ');

            expect(() => {
                new Parser('(ba');
            }).toThrowWithMessage(TSError, errMsg);
        });
    });

    describe('when given a invalid query "AND foo:bar"', () => {
        it('should throw an error', () => {
            const errMsg = 'Failure to parse xlucene query "AND foo:bar", caused by SyntaxError: Expected term, or whitespace but ":" found.';
            expect(() => {
                new Parser('AND foo:bar');
            }).toThrowWithMessage(TSError, errMsg);
        });
    });

    describe('when given a invalid query "OR foo:bar"', () => {
        it('should throw an error', () => {
            const errMsg = 'Failure to parse xlucene query "OR foo:bar", caused by SyntaxError: Expected term, or whitespace but ":" found.';
            expect(() => {
                new Parser('OR foo:bar');
            }).toThrowWithMessage(TSError, errMsg);
        });
    });

    describe('when given a invalid function query "location: something(hello: "world")', () => {
        it('should throw an error', () => {
            const errMsg = 'Failure to parse xlucene query "location: something(hello:"world")", caused by Error: Could not find an xlucene function with name "something"';
            expect(() => {
                new Parser('location: something(hello:"world")');
            }).toThrowWithMessage(TSError, errMsg);
        });
    });

    describe('when given a invalid function query "location:geoBox()", it can still parse syntax but break at validation', () => {
        it('should throw an error', () => {
            const errMsg = 'Failure to parse xlucene query "location:geoBox()", caused by Error: Invalid geoBox query, need to specify a "topLeft" parameter';
            expect(() => {
                new Parser('location:geoBox()');
            }).toThrowWithMessage(TSError, errMsg);
        });
    });

    describe('when given a invalid function query "location:geoPolygon(points:[["123.43,223.43", "102.3,123.4"], "99.3,154.4" ])", it can still parse array of arrays but break validation', () => {
        it('should throw an error', () => {
            expect(() => {
                new Parser('location:geoPolygon(points:[["123.43,223.43", "102.3,123.4"], "99.3,154.4" ])');
            }).toThrow();
        });
    });

    describe('when given variables in a query', () => {
        it('should throw an error if no variables are supplied', () => {
            const errMsg = /Could not find a variable set with key "bar"/;
            expect(() => {
                new Parser('foo:$bar');
            }).toThrowWithMessage(TSError, errMsg);
        });

        it('should throw an error if a variable value is an object if the field name is not part of a function expression', () => {
            expect(() => {
                new Parser('foo:$bar', {
                    variables: {
                        bar: { some: 'value' },
                        other: 'variable'
                    }
                });
            }).toThrow();
        });
    });

    it('restricted variables will throw if given bad values', () => {
        const query = 'foo: $bar';
        const typeConfig = { foo: xLuceneFieldType.String };
        const errMsg = 'Unsupported type of';

        function test(val: any) {
            const variables = { bar: val };

            try {
                new Parser(query, {
                    type_config: typeConfig,
                    // @ts-ignore
                    variables
                });
                throw new Error('this should throw');
            } catch (err) {
                expect(err.message).toContain(errMsg);
            }
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

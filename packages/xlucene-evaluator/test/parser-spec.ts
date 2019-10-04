import 'jest-extended';
import { TSError, times } from '@terascope/utils';
import allTestCases from './cases/parser';
import { Parser, ASTType } from '../src';

describe('Parser', () => {
    for (const [key, testCases] of Object.entries(allTestCases)) {
        describe(`when testing ${key.replace('_', ' ')} queries`, () => {
            describe.each(testCases)('given query %s', (query, msg, ast, typeConfig) => {
                it(`should be able to parse ${msg}`, () => {
                    const parser = new Parser(query, {
                        type_config: typeConfig
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
            const errMsg = 'Failure to parse xlucene query "location:geoBox()", caused by Error: geoBox query needs to specify a "topLeft" parameter';
            expect(() => {
                new Parser('location:geoBox()');
            }).toThrowWithMessage(TSError, errMsg);
        });
    });

    describe('when given a invalid function query "location:geoPolygon(points:[["123.43,223.43", "102.3,123.4"], "99.3,154.4" ])", it can still parse array of arrays but break validation', () => {
        it('should throw an error', () => {
            const errMsg = 'Failure to parse xlucene query "location:geoPolygon(points:[["123.43,223.43", "102.3,123.4"], "99.3,154.4" ])", caused by Error: points parameter must be an array of string values';
            expect(() => {
                new Parser('location:geoPolygon(points:[["123.43,223.43", "102.3,123.4"], "99.3,154.4" ])');
            }).toThrowWithMessage(TSError, errMsg);
        });
    });
});

import 'jest-extended';
import { TSError } from '@terascope/utils';
import allTestCases from './cases/parser';
import { Parser } from '../src/parser';

describe('Parser', () => {
    for (const [key, testCases] of Object.entries(allTestCases)) {
        describe(`when testing ${key.replace('_', ' ')} queries`, () => {
            describe.each(testCases)('given query %s', (query, msg, ast) => {
                it(`should be able to parse ${msg}`, () => {
                    const parser = new Parser(query);
                    expect(parser.ast).toMatchObject(ast);
                });
            });
        });
    }

    describe('when given a invalid query "(ba"', () => {
        it('should throw an error', () => {
            const errMsg = 'Failure to parse xlucene query "(ba", caused by SyntaxError: Expected ")", field, term, or whitespace but end of input found.';
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
});

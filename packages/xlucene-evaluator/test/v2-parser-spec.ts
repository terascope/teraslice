import 'jest-extended';
import { TSError } from '@terascope/utils';
import allTestCases from './cases/parser';
import { Parser } from '../src/parser';

describe('Parser (v2)', () => {
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

    describe('when given a invalid query', () => {
        it('should throw an error', () => {
            const errMsg = 'Failure to parse xlucene query "(ba", caused by SyntaxError: Expected ")", field, term, or whitespace but end of input found.';
            expect(() => {
                new Parser('(ba');
            }).toThrowWithMessage(TSError, errMsg);
        });
    });
});

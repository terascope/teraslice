import 'jest-extended';
import allTestCases from './cases/parser';
import { Parser } from '../src/parser';

describe('Parser (v2)', () => {
    for (const [key, testCases] of Object.entries(allTestCases)) {
        describe(`when testing ${key} queries`, () => {
            describe.each(testCases)('given query %s', (query, msg, ast) => {
                it(`should be able to parse ${msg}`, () => {
                    const parser = new Parser(query);
                    expect(parser.ast).toMatchObject(ast);
                });
            });
        });
    }
});

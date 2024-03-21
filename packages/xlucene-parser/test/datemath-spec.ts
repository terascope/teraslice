import 'jest-extended';
import { toString } from '@terascope/utils';
import dateMathCases from './cases/range-datemath';
import { Parser } from '../src';

// FIXME temporarily keeping separate for testing this feature
// but combine with parser spec once working
describe('Parser - range - datemath', () => {
    for (const [key, testCases] of Object.entries({ dateMathCases })) {
        describe(`when testing ${key.replace('_', ' ')} queries`, () => {
            describe.each(testCases)('given query %s', (query, msg, ast, typeConfig, variables) => {
                if (variables) {
                    it(`should be able to parse ${msg} with variables ${toString(variables)}`, () => {
                        const parser = new Parser(query, {
                            type_config: typeConfig,
                        }).resolveVariables(variables);

                        expect(parser.ast).toMatchObject(ast);
                    });
                } else {
                    it(`should be able to parse ${msg}`, () => {
                        const parser = new Parser(query, {
                            type_config: typeConfig,
                        });
                        expect(parser.ast).toMatchObject(ast);
                    });
                }
            });
        });
    }
});

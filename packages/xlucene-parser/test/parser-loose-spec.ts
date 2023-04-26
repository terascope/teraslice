import 'jest-extended';
import { toString } from '@terascope/utils';
import { Parser } from '../src';
import { looseTestCases } from './cases';

describe('Parser', () => {
    for (const [key, testCases] of Object.entries(looseTestCases)) {
        describe(`when testing ${key.replace('_', ' ')} queries`, () => {
            describe.each(testCases)('given query %s', (query, msg, ast, typeConfig, variables, resolved) => {
                it(`should be able to parse ${msg} ${variables ? `with variables ${toString(variables)}` : ''}`, () => {
                    const parser = new Parser(query, {
                        type_config: typeConfig,
                        loose: true,
                        variables
                    });

                    expect(parser.ast).toMatchObject(ast);
                });

                if (variables && resolved) {
                    it(`should be able to resolve variables ${toString(variables)}`, () => {
                        const parser = new Parser(query, {
                            type_config: typeConfig,
                            loose: true,
                            variables
                        }).resolveVariables(variables);

                        expect(parser.ast).toMatchObject(resolved);
                    });
                }
            });
        });
    }
});

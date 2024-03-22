/* eslint-disable jest/no-commented-out-tests */
/* eslint-disable max-len */
import 'jest-extended';
import dateMathCases, { failures } from './cases/range-datemath';
import { Parser } from '../src';

// FIXME temporarily keeping separate for testing this feature
// but combine with parser spec once working
describe('Parser - range - datemath', () => {
    for (const [key, testCases] of Object.entries({ dateMathCases })) {
        describe(`when testing ${key.replace('_', ' ')} queries`, () => {
            describe.each(testCases)('given query %s', (query, msg, expectedAst, typeConfig, variables, partialNode, testDatesFn) => {
                // if (variables) {
                //     it(`should be able to parse ${msg} with variables ${toString(variables)}`, () => {
                //         const parser = new Parser(query, {
                //             type_config: typeConfig,
                //         }).resolveVariables(variables);

                //         expect(parser.ast).toMatchObject(ast);
                //     });
                // } else {
                it(`should be able to parse ${msg}`, () => {
                    const now = new Date();
                    const parser = new Parser(query, {
                        type_config: typeConfig,
                    });
                    if (testDatesFn) {
                        testDatesFn(now, parser.ast);
                    }
                    expect(parser.ast).toMatchObject(expectedAst);
                });
                // }
            });
        });
    }

    if (!failures.length) return;

    for (const [key, testCases] of Object.entries({ failures })) {
        describe(`when testing ${key.replace('_', ' ')} queries`, () => {
            describe.each(testCases)('should throw when given query %s', (query, msg, error, typeConfig) => {
                it(`should be able to parse ${msg}`, () => {
                    expect(() => {
                        new Parser(query, {
                            type_config: typeConfig as any,
                        });
                    }).toThrow(error as string);
                });
            });
        });
    }
});

import 'jest-extended';
import { toString } from '@terascope/utils';
import { xLuceneFieldType } from '@terascope/types';
import {
    Parser, NodeType,
} from '../src';
import { looseTestCases } from './cases';

/**
 * TODO add a case for all cases - see cases folder
 * but do a simple data mate > doc matcher test first
 * and also simple translator and queryAccess tests too
 */
describe('Parser', () => {
    for (const [key, testCases] of Object.entries(looseTestCases)) {
        describe(`when testing ${key.replace('_', ' ')} queries`, () => {
            describe.each(testCases)('given query %s', (query, msg, ast, typeConfig, variables) => {
                if (variables) {
                    it(`should be able to parse ${msg} with variables ${toString(variables)}`, () => {
                        const parser = new Parser(query, {
                            type_config: typeConfig,
                            loose: true,
                            variables
                        });
                        // .resolveVariables(variables);

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

    it('should be able to resolve variables in loose mode', () => {
        const parser = new Parser('a:$foo AND b:$bar AND c:$buz', {
            type_config: {
                a: xLuceneFieldType.String,
                b: xLuceneFieldType.String,
                c: xLuceneFieldType.String
            },
            loose: true,
            variables: { foo: 'foo', bar: 'bar' }
        }).resolveVariables({ foo: 'foo', bar: 'bar' });

        expect(parser.ast).toMatchObject(
            {
                type: NodeType.LogicalGroup,
                flow: [
                    {
                        type: NodeType.Conjunction,
                        nodes: [
                            {
                                type: NodeType.Term,
                                field: 'a',
                                // value: { type: 'variable', value: 'foo', },
                                value: { type: 'value', value: 'foo' },
                            },
                            {
                                type: NodeType.Term,
                                field: 'b',
                                // value: { type: 'variable', value: 'bar', },
                                value: { type: 'value', value: 'bar' },
                            },
                        ],
                    },
                ],
            },
        );
    });
});

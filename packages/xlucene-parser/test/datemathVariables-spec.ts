import 'jest-extended';
import { xLuceneFieldType, xLuceneTypeConfig, xLuceneVariables } from '@terascope/types';
import subDays from 'date-fns/subDays';
import addDays from 'date-fns/addDays';
import { toString } from '@terascope/utils';
import {
    NodeType, Parser, Node,
} from '../src';

type TestCase = [
    // when give query %s
    string,
    // it should be able to parse %s
    string,
    // toMatchObject(%j)
    any, // Partial<Node>|string,
    // Type config to pass in
    xLuceneTypeConfig?,
    xLuceneVariables?,
    // to test resolveVariables separately
    Partial<Node>?,
    ((val: Date, ast: Node) => any)?
];
const cases: TestCase[] = [
    [
        'val:[$start TO $end]',
        'variables - relative and date math range mixed capitalization and extra spaces',
        {
            type: NodeType.Range,
            field: 'val',
            left: {
                operator: 'gte',
                field_type: xLuceneFieldType.Date,
                value: { type: 'value' } // value tested below
            },
            right: {
                operator: 'lte',
                field_type: xLuceneFieldType.Date,
                value: { type: 'value' } // value tested below
            }
        },
        { val: xLuceneFieldType.Date },
        { start: '-3   dAyS', end: 'nO W+  1d ' },
        undefined,
        (now: Date, ast: any) => {
            const _now = new Date(now.setUTCHours(0, 0, 0, 0));
            const astStartDate = new Date(ast.left.value.value.setUTCHours(0, 0, 0, 0));
            const astEndDate = new Date(ast.right.value.value.setUTCHours(0, 0, 0, 0));

            expect(astStartDate).toEqual(subDays(_now, 3));
            expect(astEndDate).toEqual(addDays(_now, 1));
        }
    ],
    [
        'val:[$start TO now+2d]',
        'variable only for left range',
        {
            type: NodeType.Range,
            field: 'val',
            left: {
                operator: 'gte',
                field_type: xLuceneFieldType.Date,
                value: { type: 'value' } // value tested below
            },
            right: {
                operator: 'lte',
                field_type: xLuceneFieldType.Date,
                value: { type: 'value' } // value tested below
            }
        },
        { val: xLuceneFieldType.Date },
        { start: '-3   dAyS', end: 'nO W+  1d ' },
        undefined,
        (now: Date, ast: any) => {
            const _now = new Date(now.setUTCHours(0, 0, 0, 0));
            const astStartDate = new Date(ast.left.value.value.setUTCHours(0, 0, 0, 0));
            const astEndDate = new Date(ast.right.value.value.setUTCHours(0, 0, 0, 0));

            expect(astStartDate).toEqual(subDays(_now, 3));
            expect(astEndDate).toEqual(addDays(_now, 2));
        }
    ],
    [
        'val:[2021-03-01 TO $end]',
        'variable only for right range',
        {
            type: NodeType.Range,
            field: 'val',
            left: {
                operator: 'gte',
                field_type: xLuceneFieldType.Date,
                value: { type: 'value' } // value tested below
            },
            right: {
                operator: 'lte',
                field_type: xLuceneFieldType.Date,
                value: { type: 'value' } // value tested below
            }
        },
        { val: xLuceneFieldType.Date },
        { start: '-3   dAyS', end: 'nO W+  3d ' },
        undefined,
        (now: Date, ast: any) => {
            const _now = new Date(now.setUTCHours(0, 0, 0, 0));
            const astStartDate = ast.left.value.value;
            const astEndDate = new Date(ast.right.value.value.setUTCHours(0, 0, 0, 0));

            expect(astStartDate).toEqual('2021-03-01');
            expect(astEndDate).toEqual(addDays(_now, 3));
        }
    ],
    [
        'val:[$start TO $end]',
        'should not convert if no type config is provided',
        {
            type: NodeType.Range,
            field: 'val',
            left: {
                operator: 'gte',
                type: NodeType.Term,
                value: { type: 'variable', scoped: false, value: 'start' }
            },
            right: {
                operator: 'lte',
                type: NodeType.Term,
                value: { type: 'variable', scoped: false, value: 'end' }
            }
        },
        undefined,
        { start: '-3   days', end: 'now+1d ' },
    ],
];

const failures: TestCase[] = [
    [
        'val:[2021-03-01 TO $end]',
        'when variable not provided',
        'Expected undefined (undefined) to be in a date like format',
        { val: xLuceneFieldType.Date },
        { srt: '-3   dAyS', ed: 'nO W+  3d ' },
    ],
];
// FIXME move to other file once working
describe('Parser', () => {
    for (const [key, testCases] of Object.entries({ cases })) {
        describe(`when testing ${key.replace('_', ' ')} queries`, () => {
            describe.each(testCases)('given query %s', (query, msg, expectedAst, typeConfig, variables, partialNode, testDatesFn) => {
                if (variables) {
                    it(`should be able to parse ${msg} with variables ${toString(variables)}`, () => {
                        const now = new Date();
                        const parser = new Parser(query, {
                            type_config: typeConfig,
                        }).resolveVariables(variables);

                        if (testDatesFn) {
                            testDatesFn(now, parser.ast);
                        }

                        expect(parser.ast).toMatchObject(expectedAst);
                    });
                } else {
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
                }
            });
        });
    }

    if (!failures.length) return;
    for (const [key, testCases] of Object.entries({ failures })) {
        describe(`when testing ${key.replace('_', ' ')} queries`, () => {
            describe.each(testCases)('should throw when given query %s', (query, msg, error, typeConfig, variables) => {
                it(`should be able to parse ${msg}`, () => {
                    expect(() => {
                        new Parser(query, {
                            type_config: typeConfig as any,
                        }).resolveVariables(variables!);
                    }).toThrow(error as string);
                });
            });
        });
    }
});

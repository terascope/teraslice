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

/**
 * NOTE -
 * simple math expr like + and - work but more complex ones don't
 * i think we have to adjust the peg engine
 */
const cases: TestCase[] = [
    [
        'val:[now-4d/y TO 2021-01-02||+4d]', // 'val:[now-4d/y TO 2021-01-02||+4d]',
        'more complex date math - division and anchor add',
        {
            type: NodeType.Range,
            field: 'val', // { start: 'now-4d/y', end: '2021-01-02||+4d' },
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
        undefined, // { start: 'now-4d/y', end: '2021-01-02||+4d' },
        undefined,
        (now: Date, ast: any) => {
            // /y should make it start of year
            expect(new Date(ast.left.value.value).toISOString()).toInclude('01-01T00:00:00.000');
            // should be 1-2-21 plus 4 days
            expect(new Date(ast.right.value.value).toISOString()).toInclude('2021-01-06T00:00:00.000');
        }
    ]
];

// FIXME move to other file once working
// eslint-disable-next-line jest/no-disabled-tests
xdescribe('Parser', () => {
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

    // if (!failures.length) return;
    // for (const [key, testCases] of Object.entries({ failures })) {
    //     describe(`when testing ${key.replace('_', ' ')} queries`, () => {
    //         describe.each(testCases)('should throw when given query %s', (query, msg, error, typeConfig, variables) => {
    //             it(`should be able to parse ${msg}`, () => {
    //                 expect(() => {
    //                     new Parser(query, {
    //                         type_config: typeConfig as any,
    //                     }).resolveVariables(variables!);
    //                 }).toThrow(error as string);
    //             });
    //         });
    //     });
    // }
});

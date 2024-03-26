import { xLuceneFieldType } from '@terascope/types';
import subDays from 'date-fns/subDays';
import addDays from 'date-fns/addDays';
import { NodeType, Node } from '../../src';
import { TestCase } from './interfaces';

export const relativeDateRanges = [
    [
        'val:[-3d TO 2d]',
        'should NOT coerce to relative date to date when no type config provided',
        {
            type: NodeType.Range,
            field: 'val',
            left: {
                operator: 'gte',
                field_type: xLuceneFieldType.String,
                value: { type: 'value', value: '-3d', }
            },
            right: {
                operator: 'lte',
                field_type: xLuceneFieldType.String,
                value: { type: 'value', value: '2d', }
            }
        },
    ],
    [
        'val:[now-2w TO now+2y]',
        'should NOT coerce to date math to date when no type config provided',
        {
            type: NodeType.Range,
            field: 'val',
            left: {
                operator: 'gte',
                field_type: xLuceneFieldType.String,
                value: { type: 'value', value: 'now-2w', }
            },
            right: {
                operator: 'lte',
                field_type: xLuceneFieldType.String,
                value: { type: 'value', value: 'now+2y', }
            }
        },
    ],
    [
        'val:[-3d TO 2D]',
        'relative date range upper/lowercase initials',
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
        } as Node,
        { val: xLuceneFieldType.Date },
        undefined, undefined,
        (now: Date, ast: any) => {
            const _now = new Date(now.setUTCHours(0, 0, 0, 0));
            const astStartDate = new Date(ast.left.value.value.setUTCHours(0, 0, 0, 0));
            const astEndDate = new Date(ast.right.value.value.setUTCHours(0, 0, 0, 0));

            expect(astStartDate).toEqual(subDays(_now, 3));
            expect(astEndDate).toEqual(addDays(_now, 2));
        }
    ],
    [
        'val:[-3days TO 2DayS]',
        'relative date range mixed capitalization spelled out',
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
        undefined, undefined,
        (now: Date, ast: any) => {
            const _now = new Date(now.setUTCHours(0, 0, 0, 0));
            const astStartDate = new Date(ast.left.value.value.setUTCHours(0, 0, 0, 0));
            const astEndDate = new Date(ast.right.value.value.setUTCHours(0, 0, 0, 0));

            expect(astStartDate).toEqual(subDays(_now, 3));
            expect(astEndDate).toEqual(addDays(_now, 2));
        }
    ],
    [
        'val:[now+2d+4d TO now+20d-3d-1d+5d]',
        'date math range with extra addition and subtraction',
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
        undefined, undefined,
        (now: Date, ast: any) => {
            const _now = new Date(now.setUTCHours(0, 0, 0, 0));
            const astStartDate = new Date(ast.left.value.value.setUTCHours(0, 0, 0, 0));
            const astEndDate = new Date(ast.right.value.value.setUTCHours(0, 0, 0, 0));

            expect(astStartDate).toEqual(addDays(_now, 6));
            expect(astEndDate).toEqual(addDays(_now, 21));
        }
    ],
    [
        'val:[now TO now+5D]',
        'date math range with left now',
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
        undefined, undefined,
        (now: Date, ast: any) => {
            const _now = new Date(now.setUTCHours(0, 0, 0, 0));
            const astStartDate = new Date(ast.left.value.value.setUTCHours(0, 0, 0, 0));
            const astEndDate = new Date(ast.right.value.value.setUTCHours(0, 0, 0, 0));

            expect(astStartDate).toEqual(_now);
            expect(astEndDate).toEqual(addDays(_now, 5));
        }
    ],
    [
        'val:[now TO 5Days]',
        'date math now to relative time',
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
        undefined, undefined,
        (now: Date, ast: any) => {
            const _now = new Date(now.setUTCHours(0, 0, 0, 0));
            const astStartDate = new Date(ast.left.value.value.setUTCHours(0, 0, 0, 0));
            const astEndDate = new Date(ast.right.value.value.setUTCHours(0, 0, 0, 0));

            expect(astStartDate).toEqual(_now);
            expect(astEndDate).toEqual(addDays(_now, 5));
        }
    ],
    [
        'val:{-3d TO now}',
        'relative to date math now',
        {
            type: NodeType.Range,
            field: 'val',
            left: {
                operator: 'gt',
                field_type: xLuceneFieldType.Date,
                value: { type: 'value' } // value tested below
            },
            right: {
                operator: 'lt',
                field_type: xLuceneFieldType.Date,
                value: { type: 'value' } // value tested below
            }
        },
        { val: xLuceneFieldType.Date },
        undefined, undefined,
        (now: Date, ast: any) => {
            const _now = new Date(now.setUTCHours(0, 0, 0, 0));
            const astStartDate = new Date(ast.left.value.value.setUTCHours(0, 0, 0, 0));
            const astEndDate = new Date(ast.right.value.value.setUTCHours(0, 0, 0, 0));

            expect(astStartDate).toEqual(subDays(_now, 3));
            expect(astEndDate).toEqual(_now);
        }
    ],
    [
        'val:[2021-04-20 TO now]',
        'date combined with date math now',
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
        undefined, undefined,
        (now: Date, ast: any) => {
            const _now = new Date(now.setUTCHours(0, 0, 0, 0));
            const astStartDate = ast.left.value.value;
            const astEndDate = new Date(ast.right.value.value.setUTCHours(0, 0, 0, 0));

            expect(astStartDate).toEqual('2021-04-20');
            expect(astEndDate).toEqual(_now);
        }
    ],
    [
        'val:[2021-04-20 TO 20seconds]',
        'date combined with relative',
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
        undefined, undefined,
        (now: Date, ast: any) => {
            const _now = new Date(now.setUTCHours(0, 0, 0, 0));
            const astStartDate = ast.left.value.value;
            const astEndDate = new Date(ast.right.value.value.setUTCHours(0, 0, 0, 0));

            expect(astStartDate).toEqual('2021-04-20');
            expect(astEndDate).toEqual(_now);
        }
    ],
    [
        'val:[now TO -3d]',
        'when end is before start (we decided not to throw right now - but 0 results will return)',
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
        undefined, undefined,
        (now: Date, ast: any) => {
            const _now = new Date(now.setUTCHours(0, 0, 0, 0));
            const astStartDate = new Date(ast.left.value.value.setUTCHours(0, 0, 0, 0));
            const astEndDate = new Date(ast.right.value.value.setUTCHours(0, 0, 0, 0));

            expect(astStartDate).toEqual(_now);
            expect(astEndDate).toEqual(subDays(_now, 3));
        }
    ],
    [
        'val:[-5days TO -2dAyS]',
        'extra spaces and odd capitalization',
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
        undefined, undefined,
        (now: Date, ast: any) => {
            const _now = new Date(now.setUTCHours(0, 0, 0, 0));
            const astStartDate = new Date(ast.left.value.value.setUTCHours(0, 0, 0, 0));
            const astEndDate = new Date(ast.right.value.value.setUTCHours(0, 0, 0, 0));

            expect(astStartDate).toEqual(subDays(_now, 5));
            expect(astEndDate).toEqual(subDays(_now, 2));
        }
    ],
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
        } as Node,
        undefined,
        { start: '-3   days', end: 'now+1d ' },
    ],
    [
        'val:[$start TO $end]',
        'variable more complex date math - division and anchor add',
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
        { start: 'now-4d/y', end: '2021-01-02||+4d' },
        undefined,
        (now: Date, ast: any) => {
            // /y should make it start of year
            expect(new Date(ast.left.value.value).toISOString()).toInclude('01-01T00:00:00.000');
            // should be 1-2-21 plus 4 days
            expect(new Date(ast.right.value.value).toISOString()).toInclude('2021-01-06T00:00:00.000');
        }
    ],
] as TestCase[];

export const relativeDateRangeFailures = [
    [
        'val:[2021-03-01 TO $end]',
        'when variable not provided',
        'Expected undefined (undefined) to be in a date like format',
        { val: xLuceneFieldType.Date },
        { srt: '-3   dAyS', ed: 'nO W+  3d ' },
    ],
    [
        'val:[nww TO -3d]',
        'when date math "now" is misspelled',
        'Failure to parse xLucene query "val:[nww TO -3d]", caused by Error: Expected nww (String) to be in a date like format',
        { val: xLuceneFieldType.Date },
    ],
    [
        'val:[now TO 3dys]',
        'when relative unit is misspelled',
        'Failure to parse xLucene query "val:[now TO 3dys]", caused by Error: Expected 3dys (String) to be in a date like format',
        { val: xLuceneFieldType.Date },
    ],
    [
        'val:[now TO 3days%2]',
        'when relative date special characters are used',
        'Failure to parse xLucene query "val:[now TO 3days%2]", caused by Error: Expected 3days%2 (String) to be in a date like format',
        { val: xLuceneFieldType.Date },
    ],
    [
        'val:[now TO 3 days]',
        'when relative date has spaces',
        'Failure to parse xLucene query "val:[now TO 3 days]", caused by SyntaxError: Expected "]", "}", or a character between 0-9 but " " found.',
        { val: xLuceneFieldType.Date },
    ],
];

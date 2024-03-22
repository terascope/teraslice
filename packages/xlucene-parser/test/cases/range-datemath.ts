import { xLuceneFieldType } from '@terascope/types';
import { addToDate, subtractFromDate } from '@terascope/utils';
import {
    NodeType,
    //  Range, RangeNode
} from '../../src';
import { TestCase } from './interfaces';

const date = new Date();
export default [
    [ // FIXME don't need - in range - just example for now
        'val:[2012-01-01 TO 2012-12-31]',
        'inclusive date range',
        {
            type: NodeType.Range,
            field: 'val',
            left: {
                operator: 'gte',
                field_type: xLuceneFieldType.String,
                restricted: true,
                value: { type: 'value', value: '2012-01-01', }
            },
            right: {
                operator: 'lte',
                field_type: xLuceneFieldType.String,
                restricted: true,
                value: { type: 'value', value: '2012-12-31', }
            }
        } as any
    ],
    // FIXME
    // [ // query, msg, ast, typeConfig, --> maybe testDateValue as a fns
    //     'val:[-3d TO 2D]',
    //     'inclusive date range',
    //     {
    //         type: NodeType.Range,
    //         field: 'val',
    //         left: {
    //             operator: 'gte',
    //             field_type: xLuceneFieldType.String,
    //             restricted: true,
    //             // if (isTest) shorten the value
    //             // or add a separate test case variable to test the value
    //             // by a function that could check if the days within the same day
    //             value: { type: 'value', value: new Date(subtractFromDate(date, { days: 3 })) }
    //         },
    //         right: {
    //             operator: 'lte',
    //             field_type: xLuceneFieldType.String,
    //             restricted: true,
    //             value: { type: 'value', value: new Date(addToDate(date, { days: 2 })) }
    //         }
    //     } as any,
    //     { val: xLuceneFieldType.Date }
    // ],
] as TestCase[];

/**
 * 'val:[-3d TO 3d]'
 * 'date math range'
 *
 * 'val:[now TO 3d]'
 * 'date math range with left now'
 *
 * 'val:[-3d TO now]'
 * 'date math range with right now'
 *
 * 'val:[2021-04-20 TO now]'
 * 'date combined with date math range'
 *
 * 'val:[now TO -3d]'
 * 'when end is before start'
 *
 * 'val:[nww TO -3d]'
 * 'when date math language is wrong'
 *
 * 'val:[now TO -3days]'
 * 'when date math unit is not abbreviated'
 *
 * 'val:[now TO -3days]'
 * 'when type config not provided should skip date math'
 *
 * don't think need to check inclusive [ vs exclusive {
 * since covered under range spec
 */

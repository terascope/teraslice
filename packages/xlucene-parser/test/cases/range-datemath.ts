import { xLuceneFieldType } from '@terascope/types';
import {
    NodeType,
    //  Range, RangeNode
} from '../../src';
import { TestCase } from './interfaces';

// FIXME keeping separate to easily just run these, but move when done to range spec
export default [
    [ // FIXME don't need - in range spec - just example for now
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
] as TestCase[];

/**
 * TEST CASES IDEAS TO START
 *
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

import 'jest-extended';
import { xLuceneFieldType } from '@terascope/types';
import { Parser } from '../src';

// FIXME move to other file once working
describe('Parser', () => {
    it('variables', () => {
        // [
        //     'val:[-3days TO 2DayS]',
        //     'relative date range mixed capitalization spelled out',
        //     {
        //         type: NodeType.Range,
        //         field: 'val',
        //         left: {
        //             operator: 'gte',
        //             field_type: xLuceneFieldType.Date,
        //             value: { type: 'value' } // value tested below
        //         },
        //         right: {
        //             operator: 'lte',
        //             field_type: xLuceneFieldType.Date,
        //             value: { type: 'value' } // value tested below
        //         }
        //     },
        //     { val: xLuceneFieldType.Date },

        const variables = {
            start: '-3   days',
            end: 'now+1d '
        };
        const parser = new Parser('val:[$start TO $end]', {
            type_config: { val: xLuceneFieldType.Date },
            filterNilVariables: true,
            variables
        }).resolveVariables(variables);

        // FIXME
        expect(parser.ast).toBeTruthy();
    });
});

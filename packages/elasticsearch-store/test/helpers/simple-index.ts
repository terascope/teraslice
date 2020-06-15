import { Overwrite } from '@terascope/utils';
import { DataType } from '@terascope/data-types';

export interface SimpleRecord {
    test_id: string;
    test_keyword: string;
    test_object: Record<string, any>;
    test_number: number;
    test_boolean: boolean;
    _created: string;
    _updated: string;
}

export type SimpleRecordInput = Overwrite<
SimpleRecord,
{
    test_number?: number;
    test_boolean?: boolean;
    _created?: string;
    _updated?: string;
}
>;

export const dataType = new DataType({
    fields: {
        test_id: { type: 'Keyword' },
        test_keyword: { type: 'Keyword' },
        test_object: { type: 'Object', indexed: false },
        test_number: { type: 'Integer' },
        test_boolean: { type: 'Boolean' },
        _created: { type: 'Keyword' },
        _updated: { type: 'Keyword' },
    }
});

export const schema = {
    additionalProperties: false,
    properties: {
        test_id: {
            type: 'string',
        },
        test_keyword: {
            type: 'string',
        },
        test_object: {
            type: 'object',
            additionalProperties: true,
            properties: {},
        },
        test_number: {
            type: 'number',
            default: 676767,
        },
        test_boolean: {
            type: 'boolean',
            default: true,
        },
        _created: {
            format: 'date-time',
        },
        _updated: {
            format: 'date-time',
        },
    },
    required: ['test_id', 'test_keyword'],
};

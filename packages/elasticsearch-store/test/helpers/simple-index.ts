import { Overwrite } from '@terascope/types';
import { DataType } from '@terascope/data-types';
import { FieldType } from '@terascope/types';

export interface SimpleRecord {
    test_id: string;
    test_keyword: string;
    test_object: {
        example?: string;
    };
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
        test_id: { type: FieldType.Keyword },
        test_keyword: { type: FieldType.Keyword },
        test_object: { type: FieldType.Object },
        'test_object.example': { type: FieldType.Keyword },
        test_number: { type: FieldType.Integer },
        test_boolean: { type: FieldType.Boolean },
        _created: { type: FieldType.Keyword },
        _updated: { type: FieldType.Keyword },
    }
});

export const dataTypeV2 = new DataType({
    fields: {
        ...dataType.fields,
        'test_object.added': { type: FieldType.Keyword },
    }
});

/**
 * This has a breaking change
*/
export const dataTypeV3 = new DataType({
    fields: {
        ...dataType.fields,
        test_keyword: { type: FieldType.Domain },
        test_number: { type: FieldType.Float },
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

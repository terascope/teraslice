import { Overwrite } from '@terascope/utils';

export interface SimpleRecord {
    test_id: string;
    test_keyword: string;
    test_object: object;
    test_number: number;
    test_boolean: boolean;
}

export type SimpleRecordInput = Overwrite<SimpleRecord, {
    test_number?: number;
    test_boolean?: boolean;
}>;

export const simpleRecordSchema = {
    additionalProperties: false,
    properties: {
        test_id: {
            type: 'string'
        },
        test_keyword: {
            type: 'string'
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
        }
    },
    required: ['test_id', 'test_keyword']
};

export const simpleMapping = {
    _all: {
        enabled: false
    },
    dynamic: false,
    properties: {
        test_id: {
            type: 'keyword'
        },
        test_keyword: {
            type: 'keyword'
        },
        test_object: {
            type: 'object'
        },
        test_boolean: {
            type: 'boolean'
        },
        test_number: {
            type: 'integer'
        },
        _created: {
            type: 'date'
        },
        _updated: {
            type: 'date'
        }
    }
};

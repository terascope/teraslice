import { Overwrite } from '@terascope/utils';

export interface SimpleRecord {
    test_id: string;
    test_keyword: string;
    test_object: object;
    test_number: number;
    test_boolean: boolean;
    _created: string;
    _updated: string;
}

export type SimpleRecordInput = Overwrite<SimpleRecord, {
    test_number?: number;
    test_boolean?: boolean;
    _created?: Date|string;
    _updated?: Date|string;
}>;

export const schema = {
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
        },
        _created: {
            format: 'date-time',
        },
        _updated: {
            format: 'date-time',
        }
    },
    required: ['test_id', 'test_keyword']
};

export const mapping = {
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

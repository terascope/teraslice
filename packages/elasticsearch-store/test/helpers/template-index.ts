import { Overwrite } from '@terascope/utils';

export interface TemplateRecord {
    some_id: string;
    search_keyword: string;
    random_number: number;
    _created: string;
    _updated: string;
}

export type TemplateRecordInput = Overwrite<TemplateRecord, {
    random_number?: number;
    _created?: Date|string;
    _updated?: Date|string;
}>;

export const schema = {
    additionalProperties: false,
    properties: {
        some_id: {
            type: 'string'
        },
        search_keyword: {
            type: 'string'
        },
        random_number: {
            type: 'number',
            default: Math.round(Math.random() * 10000),
        },
        _created: {
            format: 'date-time',
        },
        _updated: {
            format: 'date-time',
        }
    },
    required: ['some_id', 'search_keyword']
};

export const mapping = {
    _all: {
        enabled: false
    },
    dynamic: false,
    properties: {
        some_id: {
            type: 'keyword'
        },
        search_keyword: {
            type: 'keyword'
        },
        random_number: {
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

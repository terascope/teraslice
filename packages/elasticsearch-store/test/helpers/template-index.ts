import { Overwrite } from '@terascope/utils';
import { DataType } from '@terascope/data-types';

export interface TemplateRecord {
    some_id: string;
    search_keyword: string;
    random_number: number;
    _created: string;
    _updated: string;
}

export type TemplateRecordInput = Overwrite<
TemplateRecord,
{
    random_number?: number;
    _created?: Date | string;
    _updated?: Date | string;
}
>;

export const dataType = new DataType({
    fields: {
        some_id: { type: 'Keyword' },
        search_keyword: { type: 'Keyword' },
        random_number: { type: 'Integer' },
        _created: { type: 'Keyword' },
        _updated: { type: 'Keyword' },
    }
});

export const schema = {
    additionalProperties: false,
    properties: {
        some_id: {
            type: 'string',
        },
        search_keyword: {
            type: 'string',
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
        },
    },
    required: ['some_id', 'search_keyword'],
};

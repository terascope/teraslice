import { ModelConfig } from '../base';
import { DataTypeModel } from '../data-types';

const config: ModelConfig<DataTypeModel> = {
    version: 1,
    name: 'data_types',
    mapping: {
        properties: {
            name: {
                type: 'keyword',
                fields: {
                    text: {
                        type: 'text',
                        analyzer: 'lowercase_keyword_analyzer'
                    }
                },
            },
            typeConfig: {
                type: 'object'
            }
        }
    },
    schema: {
        properties: {
            name: {
                type: 'string'
            },
            description: {
                type: 'string'
            },
            typeConfig: {
                type: 'object',
                additionalProperties: true,
                default: {},
            }
        },
        required: ['name']
    },
    uniqueFields: ['name']
};

export = config;

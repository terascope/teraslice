import { ModelConfig } from '../base';

const config: ModelConfig = {
    version: 1,
    name: 'roles',
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
            spaces: {
                type: 'keyword'
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
            spaces: {
                type: 'array',
                items: {
                    type: 'string'
                },
                uniqueItems: true,
                default: []
            },
        },
        required: ['name']
    },
};

export = config;

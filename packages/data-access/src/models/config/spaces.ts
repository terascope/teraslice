import { ModelConfig } from '../base';
import { SpaceModel } from '../spaces';

const config: ModelConfig<SpaceModel> = {
    version: 1,
    name: 'spaces',
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
            views: {
                type: 'keyword'
            },
            default_view: {
                type: 'keyword'
            },
            metadata: {
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
            views: {
                type: 'array',
                items: {
                    type: 'string'
                },
                uniqueItems: true,
                default: []
            },
            default_view: {
                type: 'string'
            },
            metadata: {
                type: 'object',
                additionalProperties: true,
                default: {}
            },
        },
        required: ['name']
    },
    uniqueFields: ['name'],
};

export = config;

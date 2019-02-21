import { ModelConfig } from '../base';
import { ViewModel } from '../views';

const config: ModelConfig<ViewModel> = {
    version: 1,
    name: 'views',
    mapping: {
        properties: {
            name: {
                type: 'keyword',
                fields: {
                    text: {
                        type: 'text',
                        analyzer: 'lowercase_keyword_analyzer'
                    }
                }
            },
            space: {
                type: 'keyword'
            },
            constraint: {
                type: 'keyword'
            },
            roles: {
                type: 'keyword'
            },
            excludes: {
                type: 'keyword'
            },
            includes: {
                type: 'keyword'
            },
            prevent_prefix_wildcard: {
                type: 'boolean'
            },
        }
    },
    schema: {
        properties: {
            name: {
                type: 'string',
                fields: {
                    text: {
                        type: 'text',
                        analyzer: 'lowercase_keyword_analyzer'
                    }
                },
            },
            description: {
                type: 'string'
            },
            space: {
                type: 'string'
            },
            roles: {
                type: 'array',
                items: {
                    type: 'string'
                },
                uniqueItems: true,
                default: []
            },
            excludes: {
                type: 'array',
                items: {
                    type: 'string'
                },
                uniqueItems: true,
                default: []
            },
            includes: {
                type: 'array',
                items: {
                    type: 'string'
                },
                uniqueItems: true,
                default: []
            },
            constraint: {
                type: 'string'
            },
            prevent_prefix_wildcard: {
                type: 'boolean',
                default: true
            }
        },
        required: ['name', 'space']
    }
};

export = config;

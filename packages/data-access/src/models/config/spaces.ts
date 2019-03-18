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
            endpoint: {
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
            roles: {
                type: 'keyword'
            },
            data_type: {
                type: 'keyword'
            },
            search_config: {
                type: 'object'
            },
            streaming_config: {
                type: 'object'
            }
        }
    },
    schema: {
        properties: {
            name: {
                type: 'string'
            },
            endpoint: {
                type: 'string'
            },
            description: {
                type: 'string'
            },
            data_type: {
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
            roles: {
                type: 'array',
                items: {
                    type: 'string'
                },
                uniqueItems: true,
                default: []
            },
            search_config: {
                type: 'object',
                additionalProperties: true,
                default: {},
                properties: {
                    index: {
                        type: 'string',
                    },
                    connection: {
                        type: 'string',
                        default: 'default'
                    },
                    max_query_size: {
                        type: 'number',
                        default: 10000
                    },
                    sort_default: {
                        type: 'string',
                    },
                    sort_dates_only: {
                        type: 'boolean',
                        default: false,
                    },
                    default_geo_field: {
                        type: 'string',
                    },
                    preserve_index_name: {
                        type: 'boolean',
                        default: false
                    },
                    require_query: {
                        type: 'boolean',
                        default: false,
                    },
                    default_date_field: {
                        type: 'string',
                    },
                    history_prefix: {
                        type: 'string',
                    }
                }
            },
            streaming_config: {
                type: 'object',
                additionalProperties: true,
                default: {},
                properties: {
                    connection: {
                        type: 'string',
                        default: 'default'
                    },
                }
            }
        },
        required: ['name', 'data_type']
    },
    uniqueFields: ['endpoint'],
    sanitizeFields: {
        endpoint: 'toSafeString'
    }
};

export = config;

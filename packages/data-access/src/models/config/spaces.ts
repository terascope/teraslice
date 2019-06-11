import { IndexModelConfig, IndexModelRecord } from 'elasticsearch-store';

const config: IndexModelConfig<Space> = {
    version: 1,
    name: 'spaces',
    mapping: {
        properties: {
            client_id: {
                type: 'integer',
            },
            name: {
                type: 'keyword',
                fields: {
                    text: {
                        type: 'text',
                        analyzer: 'lowercase_keyword_analyzer',
                    },
                },
            },
            type: {
                type: 'keyword',
            },
            endpoint: {
                type: 'keyword',
                fields: {
                    text: {
                        type: 'text',
                        analyzer: 'lowercase_keyword_analyzer',
                    },
                },
            },
            views: {
                type: 'keyword',
            },
            roles: {
                type: 'keyword',
            },
            data_type: {
                type: 'keyword',
            },
            config: {
                type: 'object',
            },
        },
    },
    schema: {
        properties: {
            client_id: {
                type: 'number',
                multipleOf: 1.0,
                minimum: 0,
            },
            name: {
                type: 'string',
            },
            type: {
                type: 'string',
                default: 'search',
                enum: ['search', 'streaming'],
            },
            endpoint: {
                type: 'string',
            },
            description: {
                type: 'string',
            },
            data_type: {
                type: 'string',
            },
            views: {
                type: 'array',
                items: {
                    type: 'string',
                },
                uniqueItems: true,
                default: [],
            },
            roles: {
                type: 'array',
                items: {
                    type: 'string',
                },
                uniqueItems: true,
                default: [],
            },
        },
        allOf: [
            {
                if: {
                    properties: { type: { const: 'search' } },
                },
                then: {
                    properties: {
                        config: {
                            type: 'object',
                            additionalProperties: true,
                            default: {},
                            properties: {
                                index: {
                                    type: 'string',
                                },
                                connection: {
                                    type: 'string',
                                    default: 'default',
                                },
                                max_query_size: {
                                    type: 'number',
                                    default: 10000,
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
                                    default: false,
                                },
                                require_query: {
                                    type: 'boolean',
                                    default: false,
                                },
                                default_date_field: {
                                    type: 'string',
                                },
                                enable_history: {
                                    type: 'boolean',
                                    default: false,
                                },
                                history_prefix: {
                                    type: 'string',
                                },
                            },
                        },
                    },
                },
            },
            {
                if: {
                    properties: { type: { const: 'search' } },
                },
                then: {
                    properties: {
                        config: {
                            type: 'object',
                            additionalProperties: true,
                            default: {},
                            properties: {
                                connection: {
                                    type: 'string',
                                    default: 'default',
                                },
                            },
                        },
                    },
                },
            },
        ],
        required: ['client_id', 'name', 'type', 'data_type'],
    },
    uniqueFields: ['endpoint'],
    sanitizeFields: {
        endpoint: 'toSafeString',
    },
    strictMode: false,
};

export type SpaceConfigType = 'search' | 'streaming';

/**
 * The definition of a Space model
 */
export interface Space extends IndexModelRecord {
    /**
     * The mutli-tenant ID representing the client
     */
    client_id: number;

    /**
     * Name of the Space
     */
    name: string;

    /**
     * The space configuration type
     */
    type: SpaceConfigType;

    /**
     * A URL friendly name for endpoint that is associated with the space, this must be unique
     */
    endpoint: string;

    /**
     * Description of the Role
     */
    description?: string;

    /**
     * The associated data type
     */
    data_type: string;

    /**
     * A list of associated views
     */
    views: string[];

    /**
     * A list of associated roles
     */
    roles: string[];

    /**
     * Configuration for the space
     */
    config?: SpaceSearchConfig | SpaceStreamingConfig;
}

export interface SpaceStreamingConfig {
    connection?: string;
}

export interface SpaceSearchConfig {
    index: string;
    connection?: string;
    max_query_size?: number;
    sort_default?: string;
    sort_dates_only?: boolean;
    sort_enabled?: boolean;
    default_geo_field?: string;
    preserve_index_name?: boolean;
    require_query?: boolean;
    default_date_field?: string;
    enable_history?: boolean;
    history_prefix?: string;
}

export default config;

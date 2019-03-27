import { IndexModelConfig, IndexModelRecord } from 'elasticsearch-store';

const config: IndexModelConfig<Space> = {
    version: 1,
    name: 'spaces',
    mapping: {
        properties: {
            client_id: {
                type: 'integer'
            },
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
            client_id: {
                type: 'number',
                multipleOf: 1.0,
                minimum: 0,
            },
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
        required: ['client_id', 'name', 'data_type']
    },
    uniqueFields: ['endpoint'],
    sanitizeFields: {
        endpoint: 'toSafeString'
    }
};

export const GraphQLSchema = `
    type Space {
        client_id: Int!
        id: ID!
        name: String!
        endpoint: String!
        description: String
        data_type: String!
        views: [String]
        roles: [String]
        search_config: SpaceSearchConfig
        streaming_config: SpaceStreamingConfig
        created: String
        updated: String
    }

    type SpaceSearchConfig {
        index: String!
        connection: String
        max_query_size: Int
        sort_default: String
        sort_dates_only: Boolean
        sort_enabled: Boolean
        default_geo_field: String
        preserve_index_name: Boolean
        require_query: Boolean
        default_date_field: String
        history_prefix: String
    }

    type SpaceStreamingConfig {
        connection: String
    }

    input SpaceSearchConfigInput {
        index: String!
        connection: String
        max_query_size: Int
        sort_default: String
        sort_dates_only: Boolean
        sort_enabled: Boolean
        default_geo_field: String
        preserve_index_name: Boolean
        require_query: Boolean
        default_date_field: String
        history_prefix: String
    }

    input SpaceStreamingConfigInput {
        connection: String
    }

    input CreateSpaceInput {
        client_id: Int
        name: String!
        endpoint: String!
        description: String
        data_type: String!
        views: [String]
        roles: [String]
        search_config: SpaceSearchConfigInput
        streaming_config: SpaceStreamingConfigInput
    }

    input UpdateSpaceInput {
        client_id: Int
        id: ID!
        name: String
        endpoint: String
        description: String
        data_type: String
        views: [String]
        roles: [String]
        search_config: SpaceSearchConfigInput
        streaming_config: SpaceStreamingConfigInput
    }
`;

/**
 * The definition of a Space model
*/
export interface Space extends IndexModelRecord {
    /**
     * The mutli-tenant ID representing the client
    */
    client_id?: number;

    /**
     * Name of the Space
    */
    name: string;

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
     * Configuration for searching the space
    */
    search_config?: SpaceSearchConfig;

    /**
     * Configuration for streaming the space
    */
    streaming_config?: SpaceStreamingConfig;
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
    history_prefix?: string;
}

export default config;

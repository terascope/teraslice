import { IndexModelConfig, IndexModelRecord } from 'elasticsearch-store';

const config: IndexModelConfig<View> = {
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
            constraint: {
                type: 'keyword'
            },
            roles: {
                type: 'keyword'
            },
            data_type: {
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
            data_type: {
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
        required: ['name', 'data_type']
    }
};

/**
 * The definition of a View model
 *
*/
export interface View extends IndexModelRecord {
    /**
     * Name of the view
    */
    name: string;

    /**
     * Description of the view usage
    */
    description?: string;

    /**
     * The associated data type
    */
    data_type: string;

    /**
     * A list of roles this view applys to
    */
    roles: string[];

    /**
     * Fields to exclude
    */
    excludes?: string[];

    /**
     * Fields to include
    */
    includes?: string[];

    /**
     * Constraint for queries and filtering
    */
    constraint?: string;

    /**
     * Restrict prefix wildcards in search values
     *
     * @example `foo:*bar`
    */
    prevent_prefix_wildcard?: boolean;
}

export const GraphQLSchema = `
    type View {
        id: ID!
        name: String
        description: String
        data_type: String
        roles: [String]
        excludes: [String]
        includes: [String]
        constraint: String
        prevent_prefix_wildcard: Boolean
        created: String
        updated: String
    }

    input CreateViewInput {
        name: String!
        description: String
        data_type: String!
        roles: [String]
        excludes: [String]
        includes: [String]
        constraint: String
        prevent_prefix_wildcard: Boolean
    }

    input UpdateViewInput {
        id: ID!
        name: String
        description: String
        data_type: String
        roles: [String]
        excludes: [String]
        includes: [String]
        constraint: String
        prevent_prefix_wildcard: Boolean
    }

    input CreateDefaultViewInput {
        roles: [String]
        excludes: [String]
        includes: [String]
        constraint: String
        prevent_prefix_wildcard: Boolean
    }
`;

export default config;

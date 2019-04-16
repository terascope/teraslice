import { IndexModelConfig, IndexModelRecord } from 'elasticsearch-store';
import { graphQLModel } from './common';

const config: IndexModelConfig<View> = {
    version: 1,
    name: 'views',
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
            client_id: {
                type: 'number',
                multipleOf: 1.0,
                minimum: 0,
            },
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
        required: ['client_id', 'name', 'data_type']
    }
};

/**
 * The definition of a View model
 *
*/
export interface View extends IndexModelRecord {
    /**
     * The mutli-tenant ID representing the client
    */
    client_id?: number;

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
        ${graphQLModel}
        name: String
        description: String
        data_type: DataType
        roles: [ID]
        excludes: [String]
        includes: [String]
        constraint: String
        prevent_prefix_wildcard: Boolean
    }

    input CreateViewInput {
        client_id: Int
        name: String!
        description: String
        data_type: ID!
        roles: [ID]
        excludes: [String]
        includes: [String]
        constraint: String
        prevent_prefix_wildcard: Boolean
    }

    input UpdateViewInput {
        client_id: Int
        id: ID!
        name: String
        description: String
        data_type: ID
        roles: [ID]
        excludes: [String]
        includes: [String]
        constraint: String
        prevent_prefix_wildcard: Boolean
    }
`;

export default config;

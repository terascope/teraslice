import { IndexModelConfig, IndexModelRecord } from 'elasticsearch-store';

const config: IndexModelConfig<Role> = {
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
            }
        },
        required: ['name']
    },
};

export const GraphQLSchema = `
    type Role {
        id: ID!
        name: String
        description: String
        created: String
        updated: String
    }

    input CreateRoleInput {
        name: String!
        description: String
    }

    input UpdateRoleInput {
        id: ID!
        name: String
        description: String
    }
`;

export interface Role extends IndexModelRecord {
    /**
     * Name of the Role
    */
    name: string;

    /**
     * Description of the Role
    */
    description?: string;
}

export default config;

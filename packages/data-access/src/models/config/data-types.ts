import { TypeConfig } from 'xlucene-evaluator';
import { IndexModelConfig, IndexModelRecord } from 'elasticsearch-store';

const config: IndexModelConfig<DataType> = {
    version: 1,
    name: 'data_types',
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
            type_config: {
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
            description: {
                type: 'string'
            },
            type_config: {
                type: 'object',
                additionalProperties: true,
                default: {},
            }
        },
        required: ['client_id', 'name']
    },
    uniqueFields: ['name']
};

/**
 * The definition a DataType model
*/
export interface DataType extends IndexModelRecord {
    /**
     * The mutli-tenant ID representing the client
    */
    client_id?: number;

    /**
     * Name of the DataType
    */
    name: string;

    /**
     * Description of the DataType
    */
    description?: string;

    /**
     * Xlucene Type Config
    */
    type_config?: TypeConfig;
}

export const GraphQLSchema = `
    type DataType {
        client_id: Int!
        id: ID!
        name: String
        description: String
        type_config: JSON
        created: String
        updated: String
    }

    input CreateDataTypeInput {
        client_id: Int
        name: String!
        description: String
        type_config: JSON
    }

    input UpdateDataTypeInput {
        client_id: Int
        id: ID!
        name: String
        description: String
        type_config: JSON
    }
`;

export default config;

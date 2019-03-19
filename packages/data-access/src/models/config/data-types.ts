import { TypeConfig } from 'xlucene-evaluator';
import { IndexModelConfig, IndexModelRecord } from 'elasticsearch-store';

const config: IndexModelConfig<DataType> = {
    version: 1,
    name: 'data_types',
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
            type_config: {
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
            type_config: {
                type: 'object',
                additionalProperties: true,
                default: {},
            }
        },
        required: ['name']
    },
    uniqueFields: ['name']
};

/**
 * The definition a DataType model
*/
export interface DataType extends IndexModelRecord {
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
        id: ID!
        name: String
        description: String
        type_config: JSON
        created: String
        updated: String
    }

    input CreateDataTypeInput {
        name: String!
        description: String
        type_config: JSON
    }

    input UpdateDataTypeInput {
        id: ID!
        name: String
        description: String
        type_config: JSON
    }
`;

export default config;

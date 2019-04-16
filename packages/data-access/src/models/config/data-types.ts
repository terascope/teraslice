import { TypeConfig } from 'xlucene-evaluator';
import { IndexModelConfig, IndexModelRecord } from 'elasticsearch-store';
import { graphQLModel } from './common';

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
    client_id: number;

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
        ${graphQLModel}
        name: String
        description: String
        type_config: JSON
    }

    input CreateDataTypeInput {
        client_id: Int!
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

/**
 * Example interfaces for the proposal in https://github.com/terascope/teraslice/issues/1092
*/
export interface DataTypeConfig {
    /**
     * Field (use dot notation for nested)
    */
    [field: string]: FieldTypeConfig;
}

export interface FieldTypeConfig {
    /**
     * The datatype of field
    */
    type: FieldType;

    /**
     * Default value for field
     *
     * if data-type is 'date-time' this value can a fixed time or datemath
     */
    default_value?: any;

    /**
     * Make the field an array of this specific data type.
     * This makes compatibility easier in elasticsearch and the
     * type configuration easier to read and use
     *
     * @default false
    */
    is_array: boolean;

    /**
     * Require the field on either update or create
    */
    required_on?: FieldRequiredOn;

    /**
     * A list of normalize methods for field values (pre/post processing)
    */
    normalizer?: FieldNormalizer[];

    /**
     * Full text search filters (lucene supported)
     */
    search_analyzer?: FieldSearchAnalyzer;
}

export type FieldType = 'string'|'integer'|'number'|'boolean'|'geo'|'ip'|'date-time'|'object';

export type FieldRequiredOn = 'update'|'create'|'both';

/**
 * - 'lowercase' - `input.toLowerCase()`
 * - 'uppercase' - `input.toUpperCase()`
 * - 'trim' - `input.trim()`
 * - 'safe-string' - Convert input to an elasticsearch/url safe string
*/
export type FieldNormalizer = 'lowercase'|'uppercase'|'trim'|'safe-string';

/**
 *
 * - 'keyword' - Use search input as a single token.
 * - 'lowercase' - Search case-insensitive
 * - 'standard' - Splits tokens by word, ignores non-word punctuation.
*/
export type FieldSearchAnalyzer = 'keyword'|'lowercase'|'standard';

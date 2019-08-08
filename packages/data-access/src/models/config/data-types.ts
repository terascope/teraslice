import { IndexModelConfig, IndexModelRecord } from 'elasticsearch-store';
import { DataTypeConfig, LATEST_VERSION } from '@terascope/data-types';

const config: IndexModelConfig<DataType> = {
    version: 2,
    name: 'data_types',
    mapping: {
        properties: {
            name: {
                type: 'keyword',
                fields: {
                    text: {
                        type: 'text',
                        analyzer: 'lowercase_keyword_analyzer',
                    },
                },
            },
            inherit_from: {
                type: 'keyword',
            },
            config: {
                properties: {
                    version: {
                        type: 'integer',
                    },
                    fields: {
                        type: 'object',
                        enabled: false,
                    },
                },
            },
        },
    },
    schema: {
        properties: {
            name: {
                type: 'string',
            },
            description: {
                type: 'string',
            },
            inherit_from: {
                type: 'array',
                items: {
                    type: 'string',
                },
                uniqueItems: true,
                default: [],
            },
            config: {
                type: 'object',
                additionalProperties: true,
                properties: {
                    version: {
                        type: 'number',
                        default: LATEST_VERSION,
                    },
                    fields: {
                        type: 'object',
                        additionalProperties: true,
                        default: {},
                    },
                },
            },
        },
        required: ['name', 'config'],
    },
    unique_fields: ['name'],
    strict_mode: false,
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
     * DataType to inherit from
     */
    inherit_from?: string[];

    /**
     * Data Type Config
     */
    config: DataTypeConfig;
}

export default config;

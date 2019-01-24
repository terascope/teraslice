import { addDefaults } from '../utils';

/** ElasticSearch Mapping */
export const mapping = {
    _all: {
        enabled: false
    },
    dynamic: false,
    properties: {
        id: {
            type: 'keyword'
        },
        created: {
            type: 'date'
        },
        updated: {
            type: 'date'
        }
    }
};

/** JSON Schema */
export const schema = {
    additionalProperties: false,
    properties: {
        id: {
            type: 'string'
        },
        description: {
            type: 'string'
        },
        created: {
            format: 'date-time',
        },
        updated: {
            format: 'date-time',
        }
    },
    required: ['id', 'created', 'updated']
};

export function addDefaultMapping(input: object) {
    return addDefaults(input, mapping);
}

export function addDefaultSchema(input: object) {
    return addDefaults(input, schema);
}

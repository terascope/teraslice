/** Schema Version */
export const version = 1;

/** Name of Data Type */
export const name = 'roles';

/** ElasticSearch Mapping */
export const mapping = {
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
        spaces: {
            type: 'keyword'
        }
    }
};

/** JSON Schema */
export const schema = {
    properties: {
        name: {
            type: 'string'
        },
        description: {
            type: 'string'
        },
        spaces: {
            type: 'array',
            items: {
                type: 'string'
            },
            uniqueItems: true,
            default: []
        },
    },
    required: ['name']
};

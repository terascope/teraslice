/** Schema Version */
export const version = 1;

/** Name of Data Type */
export const name = 'spaces';

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
            },
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
        views: {
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


/** Schema Version */
export const version = 1;

/** Name of Data Type */
export const name = 'views';

/** ElasticSearch Mapping */
export const mapping = {
    properties: {
        name: {
            type: 'keyword'
        },
        space: {
            type: 'keyword'
        },
        constraint: {
            type: 'keyword'
        },
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
        space: {
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
        }
    },
    required: ['name', 'space']
};

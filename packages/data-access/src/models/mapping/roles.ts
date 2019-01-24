export const mapping = {
    _all: {
        enabled: false
    },
    dynamic: false,
    properties: {
        id: {
            type: 'keyword'
        },
        name: {
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

export const schema = {
    additionalProperties: false,
    properties: {
        id: {
            type: 'string'
        },
        name: {
            type: 'string'
        },
        description: {
            type: 'string'
        },
        spaces: {
            type: 'array',
            items: [
                { type: 'string' }
            ],
            default: []
        },
        created: {
            format: 'date-time',
        },
        updated: {
            format: 'date-time',
        }
    },
    required: ['id', 'name']
};

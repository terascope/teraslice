import { addDefaultMapping, addDefaultSchema } from './base';

export const mapping = addDefaultMapping({
    properties: {
        name: {
            type: 'keyword'
        }
    }
});

export const schema = addDefaultSchema({
    properties: {
        name: {
            type: 'string'
        },
        description: {
            type: 'string'
        },
        views: {
            type: 'array',
            items: [
                { type: 'string' }
            ],
            default: []
        },
    },
    required: ['name']
});

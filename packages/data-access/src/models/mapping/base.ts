import { cloneDeep, isPlainObject, uniq } from '@terascope/utils';

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

export function addDefaults(source: object, from: object) {
    const output = cloneDeep(source);
    const _mapping = cloneDeep(from);

    for (const [key, val] of Object.entries(_mapping)) {
        if (output[key] != null) {
            if (isPlainObject(val)) {
                output[key] = Object.assign(output[key], val);
            } else if (Array.isArray(val)) {
                output[key] = uniq(output[key].concat(val));
            } else {
                output[key] = val;
            }
        }
    }

    return output;
}

export function addDefaultMapping(input: object) {
    return addDefaults(input, mapping);
}

export function addDefaultSchema(input: object) {
    return addDefaults(input, schema);
}

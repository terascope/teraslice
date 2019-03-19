import * as ts from '@terascope/utils';
import nanoid from 'nanoid/async';
import generate from 'nanoid/generate';

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
    return mergeDefaults(input, mapping);
}

export function addDefaultSchema(input: object) {
    return mergeDefaults(input, schema);
}

const badIdRegex = new RegExp(/^[-_]+/);

/**
 * Make unique URL friendly id
*/
export async function makeId(len = 12): Promise<string> {
    const id = await nanoid(len);
    const result = badIdRegex.exec(id);
    if (result && result[0].length) {
        const chars = generate('1234567890abcdef', result[0].length);
        return id.replace(badIdRegex, chars);
    }
    return id;
}

/**
 * Deep copy two levels deep (useful for mapping and schema)
*/
export function mergeDefaults(source: object, from: object = {}) {
    const output = ts.cloneDeep(source);
    const _mapping = ts.cloneDeep(from);

    for (const [key, val] of Object.entries(_mapping)) {
        if (output[key] != null) {
            if (ts.isPlainObject(val)) {
                output[key] = Object.assign(output[key], val);
            } else if (Array.isArray(val)) {
                output[key] = ts.concat(output[key], val);
            } else {
                output[key] = val;
            }
        }
    }

    return output;
}

export function toInstanceName(name: string): string {
    let s = ts.trim(name);
    s = s.replace(/[_-\s]+/g, ' ');
    s = s.replace(/s$/, '');
    return s.split(' ').map(ts.firstToUpper).join('');
}

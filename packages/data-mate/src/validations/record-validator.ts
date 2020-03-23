import { AnyObject, isPlainObject } from '@terascope/utils';
import { xLuceneTypeConfig, xLuceneVariables } from '@terascope/types';
import DocumentMatcher from '../document-matcher';
import { Repository } from '../interfaces';
import { isString } from '../validations/field-validator';

export const repository: Repository = {
    required: {
        fn: required,
        config: {
            fields: {
                type: 'String',
                array: true
            }
        }
    },
    select: {
        fn: select,
        config: {
            query: {
                type: 'String',
            },
            typeConfig: {
                type: 'Object'
            },
            variables: {
                type: 'Object'
            }
        }
    },
    reject: {
        fn: reject,
        config: {
            query: {
                type: 'String',
            },
            typeConfig: {
                // Doing this for JSON type => which is ANY type
                type: 'Object'
            },
            variables: {
                // Doing this for JSON type => which is ANY type
                type: 'Object'
            }
        }
    },
};

export function required(obj: AnyObject, { fields }: { fields: string[] }) {
    const keys = Object.keys(obj);
    return fields.every((rField) => keys.includes(rField));
}

interface DMOptions {
    query: string;
    typeConfig?: xLuceneTypeConfig;
    variables?: xLuceneVariables;
}

export function select(obj: AnyObject, args: DMOptions) {
    const { query = '*', typeConfig, variables } = args;

    if (!isString(query)) throw new Error('Invalid query, must be a string');
    if ((typeConfig && !isPlainObject(typeConfig))) throw new Error('Invalid argument typeConfig must be an object');
    if ((variables && !isPlainObject(variables))) throw new Error('Invalid argument variables must be an object');

    const matcher = new DocumentMatcher(query, { type_config: typeConfig, variables });
    return matcher.match(obj);
}

export function reject(obj: AnyObject, args: DMOptions) {
    const { query = '*', typeConfig, variables } = args;

    if (!isString(query)) throw new Error('Invalid query, must be a string');
    if ((typeConfig && !isPlainObject(typeConfig))) throw new Error('Invalid argument typeConfig must be an object');
    if ((variables && !isPlainObject(variables))) throw new Error('Invalid argument variables must be an object');

    const matcher = new DocumentMatcher(query, { type_config: typeConfig, variables });
    return !matcher.match(obj);
}

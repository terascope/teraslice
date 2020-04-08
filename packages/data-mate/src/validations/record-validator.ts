/* eslint-disable @typescript-eslint/camelcase */
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
            type_config: {
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
            type_config: {
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

/**
 * This function will return false if input record does not have all specified keys
 *
 * @example
 * const obj1 = { foo: 'hello', bar: 'stuff' };
 * const obj2 = { foo: 123412 };
 * const fields = ['bar'];
 *
 * const results1 = RecordValidator.required(obj1, { fields });
 * const results2 = RecordValidator.required(obj2, { fields });
 *
 * expect(results1).toEqual(true);
 * expect(results2).toEqual(false);
 *
 * @param {AnyObject} obj
 * @param {{ fields: string[] }} { fields }
 * @returns boolean
 */

export function required(obj: AnyObject, { fields }: { fields: string[] }) {
    const keys = Object.keys(obj);
    return fields.every((rField) => keys.includes(rField));
}

interface DMOptions {
    query: string;
    type_config?: xLuceneTypeConfig;
    variables?: xLuceneVariables;
}

/**
 * Will return true if an object matches the xLucene expression
 *
 * @example
 * const obj1 = { foo: 'hello', bar: 'stuff' };
 * const obj2 = { foo: 123412 };
 * const args = { query: '_exists_:bar' };
 *
 * const results1 = RecordValidator.select(obj1, args);
 * const results2 = RecordValidator.select(obj2, args);
 *
 * expect(results1).toEqual(true);
 * expect(results2).toEqual(false);
 *
 * @param {AnyObject} obj
 * @param {{ query: string, type_config: xLuceneTypeConfig, variables: xLuceneVariables }} args
 * shape is { query: string, type_config: xLuceneTypeConfig, variables: xLuceneVariables }
 * @returns boolean
 */

export function select(obj: AnyObject, args: DMOptions) {
    const { query = '*', type_config, variables } = args;

    if (!isString(query)) throw new Error('Invalid query, must be a string');
    if ((type_config && !isPlainObject(type_config))) throw new Error('Invalid argument typeConfig must be an object');
    if ((variables && !isPlainObject(variables))) throw new Error('Invalid argument variables must be an object');

    const matcher = new DocumentMatcher(query, { type_config, variables });
    return matcher.match(obj);
}

/**
* Will return true if an object DOES NOT match the xLucene expression
 *
 * @example
 * const obj1 = { foo: 'hello', bar: 'stuff' };
 * const obj2 = { foo: 123412 };
 * const args = { query: '_exists_:bar' };
 *
 * const results1 = RecordValidator.reject(obj1, args);
 * const results2 = RecordValidator.reject(obj2, args);
 *
 * expect(results1).toEqual(false);
 * expect(results2).toEqual(true);
 *
 * @param {AnyObject} obj
 * @param {DMOptions} args
 * shape is { query: string, type_config: xLuceneTypeConfig, variables: xLuceneVariables }
 * @returns boolean
 */

export function reject(obj: AnyObject, args: DMOptions) {
    const { query = '*', type_config, variables } = args;

    if (!isString(query)) throw new Error('Invalid query, must be a string');
    if ((type_config && !isPlainObject(type_config))) throw new Error('Invalid argument typeConfig must be an object');
    if ((variables && !isPlainObject(variables))) throw new Error('Invalid argument variables must be an object');

    const matcher = new DocumentMatcher(query, { type_config, variables });
    return !matcher.match(obj);
}

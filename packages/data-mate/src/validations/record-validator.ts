import * as ts from '@terascope/core-utils';
import { FieldType, xLuceneTypeConfig, xLuceneVariables } from '@terascope/types';
import { isArray } from './field-validator.js';
import { DocumentMatcher } from '../document-matcher/index.js';
import { Repository, RecordInput, InputType } from '../interfaces.js';
import { isString } from '../validations/field-validator.js';

export const repository: Repository = {
    required: {
        fn: required,
        config: {
            fields: {
                type: FieldType.String,
                array: true
            }
        },
        primary_input_type: InputType.Object,
    },
    select: {
        fn: select,
        config: {
            query: {
                type: FieldType.String,
            },
            type_config: {
                type: FieldType.Object
            },
            variables: {
                type: FieldType.Object
            }
        },
        primary_input_type: InputType.Object,
    },
    reject: {
        fn: reject,
        config: {
            query: {
                type: FieldType.String,
            },
            type_config: {
                // Doing this for JSON type => which is ANY type
                type: FieldType.Object
            },
            variables: {
                // Doing this for JSON type => which is ANY type
                type: FieldType.Object
            }
        },
        primary_input_type: InputType.Object,
    },
};

function _filterBy(fn: any, input: any[], args?: any) {
    const sanitized = input.filter((data) => ts.isNotNil(data) && ts.isObjectEntity(data));
    if (sanitized.length === 0) return [];

    return sanitized.filter((data) => fn(data, args));
}

/**
 * This function will return false if input record does not have all specified keys
 *
 * @example
 * const obj1 = { foo: 'hello', bar: 'stuff' };
 * const obj2 = { foo: 123412 };
 * const fields = ['bar'];
 *
 * const results1 = RecordValidator.required(obj1, obj1, { fields });
 * const results2 = RecordValidator.required(obj2, obj2, { fields });
 *
 * results1; // true;
 * results2; // false;
 *
 * @param {AnyObject} obj
 * @param {{ fields: string[] }} { fields }
 * @returns boolean
 */

export function required(
    input: RecordInput,
    _parentContext: RecordInput,
    args: { fields: string[] }
): RecordInput | null {
    if (ts.isNil(input)) return null;
    if (!args?.fields || !isArray(args.fields) || !isString(args.fields)) {
        throw new Error('Parameter fields must be provided and be an array of strings');
    }

    if (isArray(input)) {
        return _filterBy(_checkKeys, input, args.fields);
    }

    return _checkKeys(input, args.fields);
}

function _checkKeys(data: ts.AnyObject, fields: string[]) {
    try {
        const keys = Object.keys(data);
        if (fields.every((rField) => keys.includes(rField))) return data;
        return null;
    } catch (_err) {
        return null;
    }
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
 * const results1 = RecordValidator.select(obj1, obj1, args);
 * const results2 = RecordValidator.select(obj2, obj2, args);
 *
 * results1; // true;
 * results2; // false;
 *
 * @param {AnyObject} obj
 * @param {{ query: string, type_config: xLuceneTypeConfig, variables: xLuceneVariables }} args
 * shape is { query: string, type_config: xLuceneTypeConfig, variables: xLuceneVariables }
 * @returns boolean
 */

export function select(
    input: RecordInput,
    _parentContext: RecordInput,
    args: DMOptions
): RecordInput | null {
    const matcher = _validateMatcher(input, args);
    if (!matcher) return null;

    if (isArray(input)) {
        const fn = (data: ts.AnyObject) => ts.isObjectEntity(data) && matcher.match(data);
        return _filterBy(fn, input);
    }

    if (ts.isObjectEntity(input) && matcher.match(input)) return input;

    return null;
}

function _validateMatcher(input: RecordInput, args: DMOptions) {
    if (ts.isNil(input)) return null;
    if (ts.isNil(args) || !ts.isObjectEntity(args)) {
        throw new Error(`Parameter args must be provided and be an object, got ${ts.getTypeOf(args)}`);
    }

    const { query = '*', type_config, variables } = args;

    if (!isString(query)) throw new Error(`Invalid query, must be a string, got ${ts.getTypeOf(args)}`);
    if ((type_config && !ts.isObjectEntity(type_config))) throw new Error(`Invalid argument typeConfig must be an object got ${ts.getTypeOf(args)}`);
    if ((variables && !ts.isObjectEntity(variables))) throw new Error(`Invalid argument variables must be an object got ${ts.getTypeOf(args)}`);

    return new DocumentMatcher(query, { type_config, variables });
}

/**
* Will return true if an object DOES NOT match the xLucene expression
 *
 * @example
 * const obj1 = { foo: 'hello', bar: 'stuff' };
 * const obj2 = { foo: 123412 };
 * const args = { query: '_exists_:bar' };
 *
 * const results1 = RecordValidator.reject(obj1, obj1, args);
 * const results2 = RecordValidator.reject(obj2, obj2, args);
 *
 * results1; // false;
 * results2; // true;
 *
 * @param {AnyObject} obj
 * @param {DMOptions} args
 * shape is { query: string, type_config: xLuceneTypeConfig, variables: xLuceneVariables }
 * @returns boolean
 */

export function reject(
    input: RecordInput,
    _parentContext: RecordInput,
    args: DMOptions
): RecordInput | null {
    const matcher = _validateMatcher(input, args);
    if (!matcher) return null;

    if (isArray(input)) {
        const fn = (data: ts.AnyObject) => ts.isObjectEntity(data) && !matcher.match(data);
        return _filterBy(fn, input);
    }

    if (ts.isObjectEntity(input) && !matcher.match(input)) return input;
    return null;
}

import { AvailableType } from '@terascope/data-types';
import * as ts from '@terascope/utils';
import { Repository, RecordInput, InputType } from '../interfaces';
import { isString, isArray } from '../validations/field-validator';

export const repository: Repository = {
    renameField: {
        fn: renameField,
        config: {
            from: {
                type: 'String'
            },
            to: {
                type: 'String'
            }
        },
        primary_input_type: InputType.Object,
        output_type: 'Object' as AvailableType,
    },
    setField: {
        fn: setField,
        config: {
            field: {
                type: 'String'
            },
            value: {
                type: 'Any'
            }
        },
        primary_input_type: InputType.Object,
        output_type: 'Object' as AvailableType,
    },
    dropFields: {
        fn: dropFields,
        config: {
            fields: {
                type: 'String',
                array: true
            }
        },
        primary_input_type: InputType.Object,
        output_type: 'Object' as AvailableType,
    },
    copyField: {
        fn: copyField,
        config: {
            from: {
                type: 'String'
            },
            to: {
                type: 'String'
            }
        },
        primary_input_type: InputType.Object,
        output_type: 'Object' as AvailableType
    },
};

/**
 * This will migrate a fields value to a new field name
 *
 * @example
 *
 * const obj = { hello: 'world' };
 * const config = { from: 'hello', to: 'goodbye' };
 * const results = RecordTransform.renameField(cloneDeep(obj), cloneDeep(obj), config);
 * results === { goodbye: 'world' };
 *
 * @param {*} record
 * @param {{ from: string; to: string }} args
 * @returns object
 */

export function renameField(
    input: RecordInput,
    _parentContext: RecordInput,
    args: { from: string; to: string }
) {
    if (ts.isNil(input)) return null;
    _validateArgs(args, ['from', 'to']);

    const { from, to } = args;
    if (!isString(from) || !isString(to)) throw new Error('Invalid parameters, from/to must be supplied be be a string');

    if (isArray(input)) {
        return input
            .map((data: any) => _migrate(data, from, to))
            .filter(ts.isNotNil);
        // we filter aftwards to remove nulls
    }

    return _migrate(input, from, to);
}

function _migrate(doc: ts.AnyObject, from: string, to: string) {
    if (!ts.isObjectLike(doc)) return null;

    doc[to] = doc[from];
    delete doc[from];

    return doc;
}

/**
 * Sets a field on a record with the given value
 *
 * @example
 *
 * const obj = { hello: 'world' };
 * const config = { field: 'other', value: 'stuff' };
 * const results = RecordTransform.setField(cloneDeep(obj), cloneDeep(obj), config);
 * results === { hello: 'world', other: 'stuff' };
 *
 * @param {*} record
 * @param {{ field: string; value: any }} args
 * @returns object
 */

export function setField(
    input: RecordInput,
    _parentContext: RecordInput,
    args: { field: string; value: any }
) {
    if (ts.isNil(input)) return null;
    _validateArgs(args, ['field', 'value']);

    const { field, value } = args;
    if (!isString(field) || value === undefined) throw new Error('Invalid parameters, please set field/value');

    if (isArray(input)) {
        return input
            .map((data: any) => {
                if (!ts.isObjectLike(data)) return null;
                data[field] = value;
                return data;
            })
            .filter(ts.isNotNil);
    }

    if (!ts.isObjectLike(input)) return null;

    input[field] = value;
    return input;
}

/**
 * removes fields from a record
 *
 * @example
 *
 * const obj = { hello: 'world', other: 'stuff', last: 'thing' };
 * const config = { fields: ['other', 'last']} ;
 * const results = RecordTransform.dropFields(cloneDeep(obj), cloneDeep(obj), config);
 * expect(results).toEqual({ hello: 'world' });
 *
 * @param {*} record
 * @param {{ fields: string[] }} args
 * @returns object
 */

export function dropFields(
    input: RecordInput,
    _parentContext: RecordInput,
    args: { fields: string[] }
) {
    if (ts.isNil(input)) return null;
    _validateArgs(args, ['fields']);

    const { fields } = args;
    if (!fields.every(isString)) throw new Error('Invalid parameters, field must be supplied and be a string');

    if (isArray(input)) {
        return input
            .map((data: any) => _removeKeys(data, fields))
            .filter(ts.isNotNil);
    }

    return _removeKeys(input, fields);
}

function _removeKeys(obj: ts.AnyObject, fields: string[]) {
    if (!ts.isObjectLike(obj)) return null;

    for (const field of fields) {
        delete obj[field];
    }

    if (Object.keys(obj).length === 0) return null;

    return obj;
}

/**
 * Will copy a field to another field
 *
 * @example
 * const obj = { hello: 'world', other: 'stuff' };
 * const config = { from: 'other', to: 'myCopy' };
 * const results = RecordTransform.copyField(cloneDeep(obj), cloneDeep(obj), config);
 * expect(results).toEqual({ hello: 'world', other: 'stuff', myCopy: 'stuff' });
 *
 * @param {*} record
 * @param {{ from: string; to: string }} args
 * @returns object
 */

export function copyField(
    input: RecordInput,
    _parentContext: RecordInput,
    args: { from: string; to: string }
) {
    if (ts.isNil(input)) return null;
    _validateArgs(args, ['from', 'to']);

    const { from, to } = args;
    if (!isString(from) || !isString(to)) throw new Error('Invalid parameters, field/copyTo must be supplied and be a string');

    if (isArray(input)) {
        return input
            .map((data: any) => _copyField(data, from, to))
            .filter(ts.isNotNil);
    }

    return _copyField(input, from, to);
}

function _copyField(doc: ts.AnyObject, from: string, to: string) {
    if (!ts.isObjectLike(doc)) return null;

    if (doc[from] !== undefined) doc[to] = doc[from];
    return doc;
}

function _validateArgs(args: ts.AnyObject, fields: string[]) {
    if (ts.isNil(args)) throw new Error('Paramter args must be provided');

    for (const key of fields) {
        if (args[key] === undefined) throw new Error(`key ${key} was not provided on args, it is required`);
    }
}

/**
 * Will run a jexl expression against the record
 *
 * @example
 * const obj = { hello: 'world', other: 'stuff' };
 * const config = { query: '[hello]', field: 'final' };
 * const results = RecordTransform.transformRecord(clone, clone, config)
 * results === { hello: 'world', other: 'stuff', final: ['world'] });
 *
 * @param {*} record
 * @param {{ field: string; query: string }} args
 * @returns object
 */

// this will be overritten by transformRecord in jexl folder
export function transformRecord(
    _input: RecordInput,
    _parentContext: RecordInput,
    _args: any
): any { }

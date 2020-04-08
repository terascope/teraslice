import { AvailableType } from '@terascope/data-types';
import { AnyObject } from '@terascope/utils';
import { Repository } from '../interfaces';
import { isString } from '../validations/field-validator';

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
        output_type: 'Object' as AvailableType
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
        output_type: 'Object' as AvailableType
    },
    dropFields: {
        fn: dropFields,
        config: {
            fields: {
                type: 'String',
                array: true
            }
        },
        output_type: 'Object' as AvailableType
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
 * const results = RecordTransform.renameField(cloneDeep(obj), config);
 * results === { goodbye: 'world' };
 *
 * @param {*} record
 * @param {{ from: string; to: string }} args
 * @returns object
 */

export function renameField(record: AnyObject, args: { from: string; to: string }) {
    const { from, to } = args;
    if (!isString(from) || !isString(to)) throw new Error('Invalid parameters, from/to must be supplied be be a string');

    record[to] = record[from];
    delete record[from];

    return record;
}

/**
 * Sets a field on a record with the given value
 *
 * @example
 *
 * const obj = { hello: 'world' };
 * const config = { field: 'other', value: 'stuff' };
 * const results = RecordTransform.setField(cloneDeep(obj), config);
 * results === { hello: 'world', other: 'stuff' };
 *
 * @param {*} record
 * @param {{ field: string; value: any }} args
 * @returns object
 */

export function setField(record: AnyObject, args: { field: string; value: any }) {
    const { field, value } = args;
    if (!isString(field) || value === undefined) throw new Error('Invalid parameters, please set field/value');

    record[field] = value;
    return record;
}

/**
 * removes fields from a record
 *
 * @example
 *
 * const obj = { hello: 'world', other: 'stuff', last: 'thing' };
 * const config = { fields: ['other', 'last']} ;
 * const results = RecordTransform.dropFields(cloneDeep(obj), config);
 * expect(results).toEqual({ hello: 'world' });
 *
 * @param {*} record
 * @param {{ fields: string[] }} args
 * @returns object
 */

export function dropFields(record: AnyObject, args: { fields: string[] }) {
    const { fields } = args;
    if (!fields.every(isString)) throw new Error('Invalid parameters, field must be supplied be be a string');

    for (const field of fields) {
        delete record[field];
    }

    return record;
}

/**
 * Will copy a field to another field
 *
 * @example
 * const obj = { hello: 'world', other: 'stuff' };
 * const config = { from: 'other', to: 'myCopy' };
 * const results = RecordTransform.copyField(cloneDeep(obj), config);
 * expect(results).toEqual({ hello: 'world', other: 'stuff', myCopy: 'stuff' });
 *
 * @param {*} record
 * @param {{ from: string; to: string }} args
 * @returns object
 */

export function copyField(record: AnyObject, args: { from: string; to: string }) {
    const { from, to } = args;
    if (!isString(from) || !isString(to)) throw new Error('Invalid parameters, field/copyTo must be supplied be be a string');

    record[to] = record[from];
    return record;
}

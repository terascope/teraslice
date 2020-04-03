import { AvailableType } from '@terascope/data-types';
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
 *
 *
 * @export
 * @param {*} record
 * @param {{ from: string; to: string }} args
 * @returns
 */
export function renameField(record: any, args: { from: string; to: string }) {
    const { from, to } = args;
    if (!isString(from) || !isString(to)) throw new Error('Invalid parameters, from/to must be supplied be be a string');

    record[to] = record[from];
    delete record[from];

    return record;
}

/**
 *
 *
 * @export
 * @param {*} record
 * @param {{ field: string; value: any }} args
 * @returns
 */
export function setField(record: any, args: { field: string; value: any }) {
    const { field, value } = args;
    if (!isString(field) || value === undefined) throw new Error('Invalid parameters, please set field/value');

    record[field] = value;
    return record;
}

/**
 *
 *
 * @export
 * @param {*} record
 * @param {{ fields: string[] }} args
 * @returns
 */
export function dropFields(record: any, args: { fields: string[] }) {
    const { fields } = args;
    if (!fields.every(isString)) throw new Error('Invalid parameters, field must be supplied be be a string');

    for (const field of fields) {
        delete record[field];
    }

    return record;
}

/**
 *
 *
 * @export
 * @param {*} record
 * @param {{ from: string; to: string }} args
 * @returns
 */
export function copyField(record: any, args: { from: string; to: string }) {
    const { from, to } = args;
    if (!isString(from) || !isString(to)) throw new Error('Invalid parameters, field/copyTo must be supplied be be a string');

    record[to] = record[from];
    return record;
}

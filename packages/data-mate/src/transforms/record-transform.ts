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
        output: 'Object' as AvailableType
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
        output: 'Object' as AvailableType
    },
    dropField: {
        fn: dropField,
        config: {
            field: {
                type: 'String'
            }
        },
        output: 'Object' as AvailableType
    },
    copyField: {
        fn: copyField,
        config: {
            field: {
                type: 'String'
            },
            copyTo: {
                type: 'String'
            }
        },
        output: 'Object' as AvailableType
    },
};

export function renameField(record: any, args: { from: string; to: string }) {
    const { from, to } = args;
    if (!isString(from) || !isString(to)) throw new Error('Invalid parameters, from/to must be supplied be be a string');

    record[to] = record[from];
    delete record[from];

    return record;
}

export function setField(record: any, args: { field: string; value: any }) {
    const { field, value } = args;
    if (!isString(field) || value === undefined) throw new Error('Invalid parameters, please set field/value');

    record[field] = value;
    return record;
}

export function dropField(record: any, args: { field: string }) {
    const { field } = args;
    if (!isString(field)) throw new Error('Invalid parameters, field must be supplied be be a string');

    delete record[field];
    return record;
}

export function copyField(record: any, args: { from: string; to: string }) {
    const { from, to } = args;
    if (!isString(from) || !isString(to)) throw new Error('Invalid parameters, field/copyTo must be supplied be be a string');

    record[to] = record[from];
    return record;
}

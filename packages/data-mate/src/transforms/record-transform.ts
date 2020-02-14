import { Repository } from '../interfaces';
import { isString } from '../validations/field-validator';

export const respoitory: Repository = {
    renameField: {
        fn: renameField,
        config: {
            oldFieldName: {
                type: 'String'
            },
            newFieldName: {
                type: 'String'
            }
        }
    },
    setField: {
        fn: setField,
        config: {
            field: {
                type: 'String'
            },
            value: {
                // We do this for JSON type, its a poor man's ANY type
                type: 'Object'
            }
        }
    },
    dropField: {
        fn: dropField,
        config: {
            field: {
                type: 'String'
            }
        }
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
        }
    },
};

export function renameField(record: any, args: { oldFieldName: string; newFieldName: string }) {
    const { oldFieldName, newFieldName } = args;
    if (!isString(oldFieldName) || !isString(newFieldName)) throw new Error('Invalid parameters, oldFieldName/newFieldName must be supplied be be a string');

    record[newFieldName] = record[oldFieldName];
    delete record[oldFieldName];

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

export function copyField(record: any, args: { field: string; copyTo: string }) {
    const { field, copyTo } = args;
    if (!isString(field) || !isString(copyTo)) throw new Error('Invalid parameters, field/copyTo must be supplied be be a string');

    record[copyTo] = record[field];
    return record;
}

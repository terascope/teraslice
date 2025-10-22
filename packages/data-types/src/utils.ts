import { DataTypeConfig, DataTypeFields, DataTypeVersion } from '@terascope/types';
import {
    isEmpty, isPlainObject, isString,
    toInteger, trim, unescapeString
} from '@terascope/core-utils';
import { mapping } from './types/mapping.js';

type ConcatStrType = string | undefined|((string | undefined)[]);
export function concatUniqueStrings(...values: ConcatStrType[]): string[] {
    const set = new Set<string>();
    values.forEach((vals) => {
        if (Array.isArray(vals)) {
            vals.forEach((val) => {
                const v = trim(val);
                if (v) set.add(v);
            });
        } else if (vals) {
            const v = trim(vals);
            if (v) set.add(v);
        }
    });
    return [...set];
}

export function joinStrings(...values: ConcatStrType[]): string {
    return concatUniqueStrings(...values).join('\n');
}

export function validateDataTypeConfig(config: DataTypeConfig): DataTypeConfig {
    if (!config || isEmpty(config)) {
        throw new Error('Missing data type config');
    }
    if (config.version == null) {
        throw new Error('Missing version in data type config');
    }
    const version = toInteger(config.version) as DataTypeVersion | false;
    if (!version || mapping[version] == null) {
        throw new Error(`Unknown data type version ${version}`);
    }
    if (!config.fields || !isPlainObject(config.fields)) {
        throw new Error('Invalid fields was specified in data type config');
    }

    const fields: DataTypeFields = {};
    for (const [_field, typeDef] of Object.entries(config.fields)) {
        const field = _field ? unescapeString(_field).trim() : '';
        if (!field || !validateField(field)) {
            throw new Error(`Invalid field "${field}" in data type config`);
        }
        if (!typeDef || !isPlainObject(typeDef) || !typeDef.type) {
            throw new Error(`Invalid type config for field "${field}" in data type config`);
        }
        fields[field] = typeDef;
    }

    return {
        version,
        fields,
    };
}

function _testFieldRegex(field: string) {
    return /^[^.]*[a-zA-Z0-9-_.]*[^.]*$/.test(field);
}

export function validateField(field: unknown): boolean {
    if (!field || !isString(field)) return false;
    if (!_testFieldRegex(field)) return false;
    return !field.includes('..');
}

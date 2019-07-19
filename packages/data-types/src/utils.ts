import * as ts from '@terascope/utils';
import { DataTypeConfig, TypeConfigFields, AvailableVersion } from './interfaces';
import { mapping } from './types/versions/mapping';

export function validateDataTypeConfig(config: DataTypeConfig): DataTypeConfig {
    if (!config || ts.isEmpty(config)) {
        throw new ts.TSError('Missing data type config');
    }
    if (config.version == null) {
        throw new ts.TSError('Missing version in data type config');
    }
    const version = ts.toInteger(config.version) as AvailableVersion | false;
    if (!version || mapping[version] == null) {
        throw new ts.TSError(`Unknown data type version ${version}`);
    }
    if (!config.fields || !ts.isPlainObject(config.fields)) {
        throw new ts.TSError('Invalid fields was specified in data type config');
    }

    const fields: TypeConfigFields = {};
    for (const [_field, typeDef] of Object.entries(config.fields)) {
        const field = _field ? ts.unescapeString(_field).trim() : '';
        if (!field || !validateField(field)) {
            throw new ts.TSError(`Invalid field "${field}" in data type config`);
        }
        if (!typeDef || !ts.isPlainObject(typeDef) || !typeDef.type) {
            throw new ts.TSError(`Invalid type config for field "${field}" in data type config`);
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

export function validateField(field: any): boolean {
    if (!field) return false;
    if (!_testFieldRegex(field)) return false;
    return !field.includes('..');
}

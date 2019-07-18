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
    for (const [field, typeDef] of Object.entries(config.fields)) {
        if (!field) {
            throw new ts.TSError(`Invalid field for ${field}`);
        }
        if (!typeDef || !ts.isPlainObject(typeDef) || !typeDef.type) {
            throw new ts.TSError(`Invalid type config for field "${field}" in data type config`);
        }
        fields[ts.unescapeString(field)] = typeDef;
    }

    return {
        version,
        fields,
    };
}

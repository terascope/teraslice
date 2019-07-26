import * as ts from '@terascope/utils';
import { mapping } from './versions/mapping';
import { FieldTypeConfig, AvailableVersion, TypeConfigFields } from '../interfaces';
import BaseType from './versions/base-type';

export class TypesManager {
    public version: AvailableVersion;

    constructor(version: AvailableVersion) {
        this.version = version;
        if (mapping[this.version] == null) throw new ts.TSError(`Unknown DataType version v${version}`);
    }

    getTypes(fields: TypeConfigFields) {
        const types: BaseType[] = [];
        for (const [field, typeDef] of Object.entries(fields)) {
            types.push(this.getType(field, typeDef));
        }
        return types;
    }

    getType(field: string, type: FieldTypeConfig) {
        const Type = ts.get(mapping, [this.version, type.type]);
        if (Type == null) throw new ts.TSError(`Type "${type.type}" was not found in version v${this.version}`);
        return new Type(field, type);
    }
}

export const LATEST_VERSION: AvailableVersion = 1;

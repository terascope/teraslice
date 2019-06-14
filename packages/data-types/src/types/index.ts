import * as ts from '@terascope/utils';
import { mapping } from './versions/mapping';
import { Type as DataType, AvailableVersion } from '../interfaces';

export class TypesManager {
    public version: AvailableVersion;

    constructor(version: AvailableVersion) {
        this.version = version;
        if (mapping[this.version] == null) throw new ts.TSError(`Unknown DataType version v${version}`);
    }

    getType(field: string, type: DataType) {
        const Type = ts.get(mapping, [this.version, type.type]);
        if (Type == null) throw new ts.TSError(`Type "${type.type}" was not found in version v${this.version}`);
        return new Type(field, type);
    }
}

export const LATEST_VERSION: AvailableVersion = 1;

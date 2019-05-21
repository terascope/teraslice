
import * as ts from '@terascope/utils';
import { mapping } from './versions/mapping';
import { TypeConfig } from '../interfaces';

export class TypesManager {
    public version: string;

    constructor(version: number) {
        this.version = `v${version}`;
        if (mapping[this.version] == null) throw new ts.TSError(`The type library does not have types for version ${version}`);
    }

    getType(field: string, { type, ...configs }: TypeConfig) {
        const Type = ts.get(mapping, [this.version, type]);
        if (Type == null) throw new ts.TSError(`Type ${type} was not found in version ${this.version}`);
        return new Type(field, configs);
    }
}

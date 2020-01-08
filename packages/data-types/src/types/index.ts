import * as ts from '@terascope/utils';
import { mapping } from './versions/mapping';
import { FieldTypeConfig, AvailableVersion, TypeConfigFields } from '../interfaces';
import BaseType, { NestedTypes, IBaseType } from './versions/base-type';

export const LATEST_VERSION: AvailableVersion = 1;

export function getTypes(fields: TypeConfigFields, version = LATEST_VERSION): BaseType[] {
    const types: BaseType[] = [];
    for (const field of Object.keys(fields).sort()) {
        types.push(getType({
            field,
            config: fields[field],
            version
        }));
    }
    return types;
}

export type GetTypeArg = {
    field: string;
    config: FieldTypeConfig;
    nestedTypes?: NestedTypes;
    version?: AvailableVersion;
};

export function getType({
    field, config, nestedTypes, version = LATEST_VERSION
}: GetTypeArg) {
    const TypeClass = ts.get(mapping, [version, config.type]) as IBaseType;
    if (TypeClass == null) {
        throw new ts.TSError(`Type "${config.type}" was not found in version v${version}`);
    }
    return new TypeClass(field, config, nestedTypes);
}

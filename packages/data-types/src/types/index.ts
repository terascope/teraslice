import * as ts from '@terascope/utils';
import { mapping } from './versions/mapping';
import { FieldTypeConfig, AvailableVersion, TypeConfigFields } from '../interfaces';
import GroupType, { NestedTypes } from './versions/group-type';
import BaseType, { IBaseType } from './versions/base-type';

export const LATEST_VERSION: AvailableVersion = 1;

export function getTypes(fields: TypeConfigFields, version = LATEST_VERSION): BaseType[] {
    const types: Record<string, GroupType|BaseType> = {};
    const groupFields: Record<string, Set<string>> = {};

    for (const field of Object.keys(fields)) {
        const [base] = field.split('.');
        if (!groupFields[base]) groupFields[base] = new Set();
        groupFields[base].add(base);
        groupFields[base].add(field);
    }

    for (const [field, group] of Object.entries(groupFields)) {
        if (group.size > 1) {
            types[field] = getGroupType({
                base: field,
                fields: [...group].map((f) => ({
                    field: f,
                    config: fields[f]
                })),
                version
            });
        } else {
            types[field] = getType({
                field,
                config: fields[field],
                version
            });
        }
    }

    // make sure sort the fields for deterministic
    return Object
        .keys(types)
        .sort()
        .map((field) => types[field]) as BaseType[];
}

export type GetGroupTypeArg = {
    base: string;
    fields: { field: string; config?: FieldTypeConfig }[];
    version?: AvailableVersion;
};

function getGroupType({
    base, fields, version = LATEST_VERSION
}: GetGroupTypeArg): GroupType {
    const objConfig: FieldTypeConfig = {
        type: 'Object',
    };

    const nestedTypes: NestedTypes = {};

    fields.forEach(({ field, config }) => {
        if (config?.description) {
            objConfig.description = config.description;
        }

        nestedTypes[field] = getType({
            field,
            config: config || { ...objConfig },
            version
        });
    });

    return new GroupType(base, version, nestedTypes);
}

export type GetTypeArg = {
    field: string;
    config: FieldTypeConfig;
    version?: AvailableVersion;
};

function getType({
    field, config, version = LATEST_VERSION
}: GetTypeArg): BaseType {
    const TypeClass = ts.get(mapping, [version, config.type]) as IBaseType;
    if (TypeClass == null) {
        throw new ts.TSError(`Type "${config.type}" was not found in version v${version}`);
    }
    return new TypeClass(field, config);
}

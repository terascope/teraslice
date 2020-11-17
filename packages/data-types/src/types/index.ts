import * as ts from '@terascope/utils';
import {
    DataTypeFieldConfig, DataTypeFields, DataTypeVersion, FieldType
} from '@terascope/types';
import { getLast, toIntegerOrThrow } from '@terascope/utils';
import { mapping } from './mapping';
import {
    GroupedFields
} from '../interfaces';
import GroupType, { NestedTypes } from './group-type';
import BaseType, { IBaseType } from './base-type';
import TupleType from './tuple-type';

export const LATEST_VERSION: DataTypeVersion = 1;

export function getGroupedFields(fields: DataTypeFields): GroupedFields {
    const groupFields: GroupedFields = {};
    for (const field of Object.keys(fields)) {
        const [base] = field.split('.');
        if (!groupFields[base]) groupFields[base] = [];
        if (!groupFields[base].includes(base)) {
            groupFields[base].push(base);
        }
        if (!groupFields[base].includes(field)) {
            groupFields[base].push(field);
        }
    }
    return groupFields;
}

/**
 * Instantiate all of the types for the group
 *
 * @todo support multiple levels deep nesting
*/
export function getTypes(
    fields: DataTypeFields,
    groupedFields: GroupedFields,
    version = LATEST_VERSION
): BaseType[] {
    const types: Record<string, GroupType|BaseType> = {};

    for (const [field, group] of Object.entries(groupedFields)) {
        if (group.length > 1) {
            const fn = fields[field].type === FieldType.Tuple ? getTupleType : getGroupType;
            types[field] = fn({
                base: field,
                baseConfig: fields[field],
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

type GetGroupTypeArg = {
    base: string;
    baseConfig: DataTypeFieldConfig;
    fields: { field: string; config?: DataTypeFieldConfig }[];
    version?: DataTypeVersion;
};

function getGroupType({
    base, fields, version = LATEST_VERSION
}: GetGroupTypeArg): GroupType {
    const nestedTypes: NestedTypes = {};

    fields.forEach(({ field, config }) => {
        nestedTypes[field] = getType({
            field,
            config: config || { type: FieldType.Any },
            version
        });
    });

    return new GroupType(base, version, nestedTypes);
}

function getTupleType({
    base, baseConfig, fields, version = LATEST_VERSION
}: GetGroupTypeArg): TupleType {
    const nestedTypes: BaseType[] = [];

    fields.forEach(({ field, config }) => {
        if (base === field) return;
        const index = toIntegerOrThrow(getLast(field.split('.')));
        nestedTypes[index] = getType({
            field,
            config: config || { type: FieldType.Any },
            version
        });
    });

    return new TupleType(base, version, baseConfig, nestedTypes);
}

export type GetTypeArg = {
    field: string;
    config: DataTypeFieldConfig;
    version?: DataTypeVersion;
};

export function getType({
    field, config, version = LATEST_VERSION
}: GetTypeArg): BaseType {
    const TypeClass = ts.get(mapping, [version, config.type]) as IBaseType;
    if (TypeClass == null) {
        throw new ts.TSError(`Type "${config.type}" was not found in version v${version}`);
    }
    return new TypeClass(field, config);
}

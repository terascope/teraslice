import {
    TSError, toIntegerOrThrow, getLast, get
} from '@terascope/core-utils';
import { DataTypeFieldConfig, DataTypeFields, FieldType } from '@terascope/types';
import { mapping } from './mapping.js';
import { GroupedFields } from '../interfaces.js';
import GroupType, { NestedTypes } from './group-type.js';
import BaseType, { IBaseType } from './base-type.js';
import TupleType from './tuple-type.js';

export const LATEST_VERSION = 1;

export function getGroupedFields(fields: DataTypeFields): GroupedFields {
    const groupFields: GroupedFields = {};
    for (const field of Object.keys(fields)) {
        const [base] = field.split('.', 1);
        groupFields[base] ??= [];
        if (field === base) {
            groupFields[base].push(field);
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
    return Object.keys(groupedFields)
        .sort() // make sure sort the fields for deterministic
        .map((field): BaseType => {
            const group = groupedFields[field].filter((f) => f !== field);
            if (group.length >= 1) {
                const fn = fields[field]?.type === FieldType.Tuple ? getTupleType : getGroupType;
                return fn({
                    base: field,
                    baseConfig: fields[field] ?? { type: FieldType.Object },
                    fields: group.map((f) => ({
                        field: f,
                        config: fields[f]
                    })),
                    version
                });
            }
            return getType({
                field,
                config: fields[field],
                version
            });
        });
}

type GetGroupTypeArg = {
    base: string;
    baseConfig: DataTypeFieldConfig;
    fields: { field: string; config?: DataTypeFieldConfig }[];
    version?: number;
};

function getGroupType({
    base, baseConfig, fields, version = LATEST_VERSION
}: GetGroupTypeArg): GroupType {
    const nestedTypes: NestedTypes = {
        [base]: getType({
            field: base,
            config: baseConfig,
            version
        })
    };

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

    if (!fields.length) {
        throw new TSError(`${FieldType.Tuple} field types require at least one field`, {
            context: { safe: true },
            statusCode: 400
        });
    }

    fields.forEach(({ field, config }) => {
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
    version?: number;
};

export function getType({
    field, config, version = LATEST_VERSION
}: GetTypeArg): BaseType {
    const TypeClass = get(mapping, [version, config.type]) as IBaseType;
    if (TypeClass == null) {
        throw new Error(`Type "${config.type}" was not found in version v${version}`);
    }
    return new TypeClass(field, config);
}

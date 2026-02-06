import {
    ESTypeMapping, ESMapping, availableFieldTypes,
    DataTypeFieldConfig, DataTypeVersion, dataTypeVersions,
    DataTypeFields, DataTypeConfig,
    DeprecatedFieldType, FieldType,
    ClientMetadata,
} from '@terascope/types';

import BaseType from './types/base-type.js';

/** An object of base fields with their child fields */
export type GroupedFields = Record<string, string[]>;

export type GraphQLTypesResult = {
    baseType: string;
    inputType?: string;
    customTypes: string[];
};

export type GraphQLOptions = {
    typeName?: string;
    description?: string;
    customTypes?: string[];
    references?: string[];
    useSnakeCase?: boolean;
    createInputType?: boolean;
    includeAllInputFields?: boolean;
};

export type MergeGraphQLOptions = {
    removeScalars?: boolean;
    references?: GraphQLTypeReferences;
    customTypes?: string[];
    createInputTypes?: boolean;
    useSnakeCase?: boolean;
    includeAllInputFields?: boolean;
};

export type GraphQLTypeReferences = { __all?: string[] } & {
    [typeName: string]: string[];
};

/**
 * @deprecated use `FieldType` from `@terascope/types`
*/
export type AvailableType = DeprecatedFieldType;

/**
 * @deprecated use `availableFieldTypes` from `@terascope/types`
*/
export const AvailableTypes = availableFieldTypes as ReadonlyArray<DeprecatedFieldType>;

/**
 * @deprecated use `DataTypeVersion` from `@terascope/types`
*/
export type AvailableVersion = DataTypeVersion;
/**
 * @deprecated use `dataTypeVersions` from `@terascope/types`
*/
export const AvailableVersions = dataTypeVersions;

/**
 * @deprecated use `DataTypeFieldConfig` from `@terascope/types`
*/
export type FieldTypeConfig = DataTypeFieldConfig;

type ActualType = Record<FieldType, {
    new (field: string, config: DataTypeFieldConfig): BaseType;
}>;

export type DataTypeMapping = { [key: string]: ActualType };

/**
 * @deprecated use `DataTypeFields` from `@terascope/types`
*/
export type TypeConfigFields = DataTypeFields;

export type { DataTypeConfig };

export interface GraphQLType {
    type: string;
    customTypes: string[];
}

export interface TypeESMapping {
    mapping: {
        [key: string]: ESTypeMapping;
    };
    analyzer?: {
        [key: string]: any;
    };
    tokenizer?: {
        [key: string]: any;
    };
    settings?: {
        [key: string]: any;
    };
}

export interface ESMappingOptions extends ClientMetadata {
    /**
     * Any opensearch mapping overrides,
     * uses a deep assignment so nested fields can be overwritten.
     */
    overrides?: Partial<ESMapping>;

    /**
     * Any metadata to add to the index mapping
     */
    _meta?: Record<string, any>;
}

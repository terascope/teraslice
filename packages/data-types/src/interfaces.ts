import { ESTypeMapping, ESMapping } from '@terascope/types';
import BaseType from './types/base-type';

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

export type AvailableType =
    | 'Boolean'
    | 'Boundary'
    | 'Byte'
    | 'Date'
    | 'Domain'
    | 'Double'
    | 'Float'
    | 'Geo'
    | 'GeoPoint'
    | 'GeoJSON'
    | 'Hostname'
    | 'Integer'
    | 'IPRange'
    | 'IP'
    | 'KeywordCaseInsensitive'
    | 'KeywordTokensCaseInsensitive'
    | 'KeywordPathAnalyzer'
    | 'KeywordTokens'
    | 'Keyword'
    | 'Long'
    | 'NgramTokens'
    | 'Object'
    | 'Short'
    | 'Text'
    | 'String'
    | 'Number'
    | 'Any';

export const AvailableTypes: AvailableType[] = [
    'Boolean',
    'Boundary',
    'Byte',
    'Date',
    'Domain',
    'Double',
    'Float',
    'Geo',
    'GeoPoint',
    'GeoJSON',
    'Hostname',
    'Integer',
    'IPRange',
    'IP',
    'KeywordCaseInsensitive',
    'KeywordTokensCaseInsensitive',
    'KeywordPathAnalyzer',
    'KeywordTokens',
    'Keyword',
    'Long',
    'NgramTokens',
    'Object',
    'Short',
    'Text',
    'String',
    'Number',
    'Any'
];

export type AvailableVersion = 1;
export const AvailableVersions: readonly AvailableVersion[] = [1];

export type FieldTypeConfig = {
    /**
     * The type of field
    */
    type: AvailableType;
    /**
     * Indicates whether the field is an array
    */
    array?: boolean;
    /**
     * A description for the fields
    */
    description?: string;
    /**
     * Specifies whether the field is index in elasticsearch
     *
     * (Only type Object currently support this)
     * @default true
    */
    indexed?: boolean;

    /**
     * A temporary flag to fix KeywordCaseInsensitive to be
     * a type keyword with case insensitive .text fields
    */
    use_fields_hack?: boolean;
};

type ActualType = {
    [key in AvailableType]: {
        new (field: string, config: FieldTypeConfig): BaseType;
    }
};

export type DataTypeMapping = { [key in AvailableVersion]: ActualType };

export type TypeConfigFields = {
    [key: string]: FieldTypeConfig;
};

export type DataTypeConfig = {
    fields: TypeConfigFields;
    version: AvailableVersion;
};

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
}

export interface ESMappingOptions {
    /**
     * The elasticsearch index type
     */
    typeName?: string;
    /**
     * Any elasticsearch mapping overrides,
     * uses a deep assignment so nested fields can be overwritten.
     */
    overrides?: Partial<ESMapping>;

    /**
     * The version of the elasticsearch cluster
     * @default 6
     */
    version?: number;
}

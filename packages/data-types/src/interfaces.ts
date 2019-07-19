import BaseType from './types/versions/base-type';
import { AnyObject } from '@terascope/utils';

export type GraphQLTypesResult = {
    schema: string;
    baseType: string;
    customTypes: string[];
};

export type GraphQLOptions = {
    typeName?: string;
    references?: string[];
};

export type GraphQLTypeReferences = { __all?: string[] } & {
    [typeName: string]: string[];
};

export type ElasticSearchTypes =
    | 'long'
    | 'integer'
    | 'short'
    | 'byte'
    | 'double'
    | 'float'
    | 'keyword'
    | 'text'
    | 'boolean'
    | 'ip'
    | 'geo_point'
    | 'object';

export type AvailableType =
    | 'Boolean'
    | 'Date'
    | 'Geo'
    | 'IP'
    | 'Byte'
    | 'Double'
    | 'Float'
    | 'Integer'
    | 'Keyword'
    | 'Long'
    | 'Short'
    | 'Text'
    | 'KeywordTokens'
    | 'Hostname'
    | 'KeywordCaseInsensitive'
    | 'KeywordTokensCaseInsensitive'
    | 'NgramTokens'
    | 'Boundary'
    | 'Object';

export const AvailableTypes: AvailableType[] = [
    'Boolean',
    'Date',
    'Geo',
    'IP',
    'Byte',
    'Double',
    'Float',
    'Integer',
    'Keyword',
    'Long',
    'Short',
    'Text',
    'KeywordTokens',
    'Hostname',
    'KeywordCaseInsensitive',
    'KeywordTokensCaseInsensitive',
    'NgramTokens',
    'Boundary',
    'Object',
];

export type AvailableVersion = 1;
export const AvailableVersions: AvailableVersion[] = [1];

export type FieldTypeConfig = {
    type: AvailableType;
    array?: boolean;
};

type ActualType = { [key in AvailableType]: { new (field: string, config: FieldTypeConfig): BaseType } };

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
    custom_type?: string;
}

export type ESTypeMapping = PropertyESTypeMapping | BasicESTypeMapping;

interface BasicESTypeMapping {
    type: ElasticSearchTypes;
}

interface PropertyESTypeMapping {
    type?: 'nested';
    properties: {
        [key: string]: BasicESTypeMapping;
    };
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

export interface ESMappingConfig {
    _all?: {
        enabled?: boolean;
        [key: string]: any;
    };
    dynamic?: boolean;
    [key: string]: any;
}

export interface ESMappingOptions {
    /**
     * The elasticsearch index type
     */
    typeName?: string;
    /**
     * Any elasitcsearch mapping overrides,
     * uses a deep assignment so nested fields can be overwritten.
     */
    overrides?: Partial<ESMapping>;
}

export interface ESMapping {
    mappings: {
        [typeName: string]: {
            properties: {
                [key: string]: ESTypeMapping;
            };
        } & ESMappingConfig;
    };
    template?: string;
    order?: number;
    aliases?: AnyObject;
    index_patterns?: string[];
    settings: ESMapSettings;
}

export interface ESMapSettings {
    'index.number_of_shards'?: number;
    'index.number_of_replicas'?: number;
    'index.refresh_interval'?: string;
    'index.max_result_window'?: number;
    analysis?: {
        analyzer?: {
            [key: string]: any;
        };
        tokenizer?: {
            [key: string]: any;
        };
    };
    [setting: string]: any;
}

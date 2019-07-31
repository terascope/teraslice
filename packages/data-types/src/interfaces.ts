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
    | 'date'
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
    | 'KeywordPathAnalyzer'
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
    custom_type?: string;
}

export type ESTypeMapping = PropertyESTypeMapping | FieldsESTypeMapping | BasicESTypeMapping;

type BasicESTypeMapping = {
    type: ElasticSearchTypes;
};

type FieldsESTypeMapping = {
    type: ElasticSearchTypes | string;
    fields: {
        [key: string]: {
            type: ElasticSearchTypes | string;
            index?: boolean | string;
            analyzer?: string;
        };
    };
};

type PropertyESTypeMapping = {
    type?: 'nested';
    properties: {
        [key: string]: FieldsESTypeMapping | BasicESTypeMapping;
    };
};

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
     * Any elasitcsearch mapping overrides,
     * uses a deep assignment so nested fields can be overwritten.
     */
    overrides?: Partial<ESMapping>;
}

export interface ESTypeMappings extends AnyObject {
    _all?: {
        enabled?: boolean;
        [key: string]: any;
    };
    dynamic?: boolean;
    properties: {
        [key: string]: ESTypeMapping;
    };
}

export interface ESMapping {
    mappings: {
        [typeName: string]: ESTypeMappings;
    };
    template?: string;
    order?: number;
    aliases?: AnyObject;
    index_patterns?: string[];
    settings: ESIndexSettings;
}

export interface ESIndexSettings {
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

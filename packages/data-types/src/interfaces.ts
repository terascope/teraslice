import BaseType from './types/versions/base-type';

export interface GraphQlResults {
    results: string;
    baseType: string;
    customTypes: string[];
}

export interface GraphQLArgs {
    typeName?: string;
    typeInjection?: string;
}

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

export type Type = {
    type: AvailableType;
    array?: boolean;
};

type ActualType = { [key in AvailableType]: { new (field: string, config: Type): BaseType } };

export type DataTypeMapping = { [key in AvailableVersion]: ActualType };

export type TypeConfigFields = {
    [key: string]: Type;
};

export type DataTypeConfig = {
    fields: TypeConfigFields;
    version: AvailableVersion;
};

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
    typeName?: string;
    settings?: ESMapSettings;
    mappingMetaData?: ESMappingConfig;
}

export interface ESMapping {
    mappings: {
        [typeName: string]: {
            properties: {
                [key: string]: ESTypeMapping;
            };
        } & ESMappingConfig;
    };
    settings: ESMapSettings;
}

export interface GraphQLType {
    type: string;
    custom_type?: string;
}

export interface ESMapSettings {
    'index.number_of_shards'?: number;
    'index.number_of_replicas'?: number;
    analysis?: {
        analyzer: {
            [key: string]: any;
        };
    };
}

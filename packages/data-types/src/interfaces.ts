import BaseType from './types/versions/base-type';
import { TypeConfig } from 'xlucene-evaluator';

export interface GraphQlResults {
    results: string;
    baseType: string;
    customTypes: string[];
}

interface ObjectConfig {
    [key: string]: any;
}

export interface GraphQLArgs {
    typeName?: string;
    typeInjection?: string;
}

export interface MappingConfiguration {
    typeName: string;
    settings?: ESMapSettings;
    mappingMetaData?: ObjectConfig;
}

export interface DataTypeManager {
    toESMapping(args: MappingConfiguration): any;
    toGraphQL(args?: GraphQLArgs): string;
    toGraphQLTypes(args?: GraphQLArgs): GraphQlResults;
    toXlucene(): TypeConfig;
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
    | 'Boundry'
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
    'Boundry',
    'Object',
];

export type Type = {
    type: AvailableType;
};

type ActualType = {
    [key in AvailableType]: { new (field: string, config: TypeConfig): BaseType };
};

export interface DataTypeMapping {
    [key: string]: ActualType;
}

export interface TypeConfigFields {
    [key: string]: Type;
}

export type DataTypeConfig = {
    fields: TypeConfigFields;
    version: number;
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

export interface ESMapping {
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

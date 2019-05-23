
import BaseType from './types/versions/base-type';

export interface GraphQlResults {
    results: string;
    baseType: string;
    customTypes: string[];
}

interface ObjectConfig {
    [key: string]: any;
}

export interface MappingConfiguration {
    typeName: string;
    settings?: EsMapSettings;
    mappingMetaData?: ObjectConfig;
}

export interface DataTypeManager {
    toESMapping({}: MappingConfiguration): any;
    toGraphQl(typeName?: string): GraphQlResults;
    toXlucene(typeName: string|null|undefined, typeInjection?:string): XluceneMapping;
}

export type String = 'keyword' | 'text';
export type Number = 'long' | 'integer' | 'short' | 'byte' | 'double' | 'float' | 'half_float' | 'scaled_float';
export type Boolean = 'boolean';
export type Geo = 'geo';
export type Ip = 'ip';
// TODO: review the use of this
export type XluceneValues = String | Number | Boolean | Geo | Ip;
export type ElasticSearchTypes = 'long'|'integer'|'short'|'byte'|'double'|'float'|'keyword'|'text'|'boolean'|'ip'|'geo_point';

export type AvailableTypes = 'Boolean'|'Date'|'Geo'|'IP'|'Byte'|'Double'|'Float'|'Integer'|'Keyword'|'Long'|'Short'|'Text';

export type TypeConfig = {
    type: AvailableTypes;
};

type ActualType = {
    [key in AvailableTypes]: { new (field:string, config: TypeConfig): BaseType }
};

export interface DataTypeMapping {
    [key: string]: ActualType;
}

export interface TypeConfigFields {
    [key: string]: TypeConfig;
}

export type DataTypeConfig = {
    fields: TypeConfigFields,
    version: number;
};

export enum NumberESType {
    long = 'long',
    integer = 'integer',
    short = 'short',
    byte = 'byte',
    double = 'double',
    float = 'float',
}

export enum GraphqlType {
    float = 'Float',
    int = 'Int'
}

export interface EsTypeMapping {
    type: ElasticSearchTypes;
}

export interface EsMapping {
    mapping: {
        [key: string]: EsTypeMapping;
    };
    analyzer?: {
        [key: string]: any;
    };
}

export interface XluceneMapping {
    [key: string]: string;
}

export interface GraphQLType {
    type: string;
    custom_type?: string;
}

export interface EsMapSettings {
    'index.number_of_shards'?: number;
    'index.number_of_replicas'?: number;
    analysis?: {
        analyzer: {
            [key: string]: any;
        }
    };
}

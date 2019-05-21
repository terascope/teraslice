
export interface GraphQlResults {
    results: string;
    baseType: string;
    customTypes: string[];
}

export interface DataTypeManager {
    toESMapping(mappingType:string, settings?: any): any;
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

export type TypeConfig = {
    type: string;
};

export type DataTypeConfig = {
    fields: {
        [key: string]: TypeConfig;
    },
    version: number;
};

export enum NumberESType {
    long = 'long',
    integer = 'integer',
    short = 'short',
    byte = 'byte',
    double = 'double',
    float = 'float',
    half_float = 'half_float',
    scaled_float = 'scaled_float',
}

export enum GraphqlType {
    float = 'Float',
    int = 'Int'
}

export interface EsMapping {
    mapping: {
        [key: string]: any;
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

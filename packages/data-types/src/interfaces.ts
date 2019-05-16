
export interface DataTypeManager {

    toESMapping(): any;
    toGraphQl(): any;
    toXlucene(): any;
}

export type StringEsMapping = 'keyword' | 'text';
export type NumberEsMapping = 'long' | 'integer' | 'short' | 'byte' | 'double' | 'float' | 'half_float' | 'scaled_float';

export type EsMapping = StringEsMapping & NumberEsMapping;

export type TypeConfig = {
    type: string;
    ESmapping?: EsMapping;
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

import { DataTypeFieldConfig, FieldType } from '@terascope/types';

export type ArgSchema = Config & { description?: string };

export enum InputType {
    String = 'String',
    Array = 'Array',
    Number = 'Number',
    Boolean = 'Boolean',
    Object = 'Object',
    Any = 'Any'
}

export interface RepoConfig {
    fn: any;
    config: ArgSchema;
    output_type?: FieldType;
    primary_input_type: InputType;
}

export interface Repository {
    [key: string]: RepoConfig;
}

interface Config {
    [key: string]: DataTypeFieldConfig;
}

export type RecordInput = Record<string, any> | Record<string, any>[];

export interface ExtractFieldConfig {
    regex?: string;
    isMultiValue?: boolean;
    jexlExp?: string;
    start?: any;
    end?: any;
}

export interface FieldTransformInterface {
    decodeBase64?: any,
    decodeHex?: any,
    decodeURL?: any,
    encodeBase64?: any,
    encodeHex?: any,
    encodeMD5?: any,
    encodeSHA?: any,
    encodeSHA1?: any,
    encodeURL?: any,
    extract?: any,
    formatDate?: any,
    map?: any,
    parseDate?: any,
    parseJSON?: any,
    replaceLiteral?: any,
    replaceRegex?: any,
    repository: Repository,
    setDefault?: any,
    setField?: any,
    splitString?: any,
    toBoolean?: any,
    toCamelCase?: any,
    toGeoPoint?: any,
    toISDN?: any,
    toISO8601?: any,
    toJSON?: any,
    toKebabCase?: any,
    toLowerCase?: any,
    toNumber?: any,
    toPascalCase?: any,
    toSnakeCase?: any,
    toString?: any,
    toTitleCase?: any,
    toUnixTime?: any,
    toUpperCase?: any,
    trim?: any,
    trimEnd?: any,
    trimStart?: any,
    truncate?:any
}

export interface RecordTransformInterface {
    copyField?: any
    dedupe?: any
    dropFields?: any
    renameField?: any
    repository: Repository
    setField?: any
    transformRecord?: any
}

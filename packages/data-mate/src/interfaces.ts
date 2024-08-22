import { DataTypeFieldConfig, FieldType } from '@terascope/types';
import { FieldTransform, RecordTransform } from './transforms/index.js';

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
    decodeBase64: typeof FieldTransform.decodeBase64;
    decodeHex: typeof FieldTransform.decodeHex;
    decodeURL: typeof FieldTransform.decodeURL;
    encodeBase64: typeof FieldTransform.encodeBase64;
    encodeHex: typeof FieldTransform.encodeHex;
    encodeMD5: typeof FieldTransform.encodeMD5;
    encodeSHA: typeof FieldTransform.encodeSHA;
    encodeSHA1: typeof FieldTransform.encodeSHA1;
    encodeURL: typeof FieldTransform.encodeURL;
    extract: typeof FieldTransform.extract;
    formatDate: typeof FieldTransform.formatDate;
    map: typeof FieldTransform.map;
    parseDate: typeof FieldTransform.parseDate;
    parseJSON: typeof FieldTransform.parseJSON;
    replaceLiteral: typeof FieldTransform.replaceLiteral;
    replaceRegex: typeof FieldTransform.replaceRegex;
    repository: Repository;
    setDefault: typeof FieldTransform.setDefault;
    setField: typeof FieldTransform.setField;
    splitString: typeof FieldTransform.splitString;
    toBoolean: typeof FieldTransform.toBoolean;
    toCamelCase: typeof FieldTransform.toCamelCase;
    toGeoPoint: typeof FieldTransform.toGeoPoint;
    toISDN: typeof FieldTransform.toISDN;
    toISO8601: typeof FieldTransform.toISO8601;
    toJSON: typeof FieldTransform.toJSON;
    toKebabCase: typeof FieldTransform.toKebabCase;
    toLowerCase: typeof FieldTransform.toLowerCase;
    toNumber: typeof FieldTransform.toNumber;
    toPascalCase: typeof FieldTransform.toPascalCase;
    toSnakeCase: typeof FieldTransform.toSnakeCase;
    toString: typeof FieldTransform.toString;
    toTitleCase: typeof FieldTransform.toTitleCase;
    toUnixTime: typeof FieldTransform.toUnixTime;
    toUpperCase: typeof FieldTransform.toUpperCase;
    trim: typeof FieldTransform.trim;
    trimEnd: typeof FieldTransform.trimEnd;
    trimStart: typeof FieldTransform.trimStart;
    truncate:typeof FieldTransform.truncate;
}

export interface RecordTransformInterface {
    copyField: typeof RecordTransform.copyField;
    dedupe: typeof RecordTransform.dedupe;
    dropFields: typeof RecordTransform.dropFields;
    renameField: typeof RecordTransform.renameField;
    repository: Repository;
    setField: typeof RecordTransform.setField;
    transformRecord: typeof RecordTransform.transformRecord;
}

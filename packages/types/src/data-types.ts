export enum FieldType {
    Boolean = 'Boolean',
    Boundary = 'Boundary',
    Byte = 'Byte',
    Date = 'Date',
    Domain = 'Domain',
    Double = 'Double',
    Float = 'Float',
    Geo = 'Geo',
    GeoPoint = 'GeoPoint',
    GeoJSON = 'GeoJSON',
    Hostname = 'Hostname',
    Integer = 'Integer',
    IPRange = 'IPRange',
    IP = 'IP',
    KeywordCaseInsensitive = 'KeywordCaseInsensitive',
    KeywordTokensCaseInsensitive= 'KeywordTokensCaseInsensitive',
    KeywordPathAnalyzer = 'KeywordPathAnalyzer',
    KeywordTokens = 'KeywordTokens',
    Keyword = 'Keyword',
    Long = 'Long',
    NgramTokens = 'NgramTokens',
    Object = 'Object',
    Short = 'Short',
    Text = 'Text',
    String = 'String',
    Number = 'Number',
    Any = 'Any',
}

/**
 * @deprecated use the enum FieldType
*/
export type DeprecatedFieldType =
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

export const availableFieldTypes: ReadonlyArray<FieldType> = Object.freeze(
    Object.values(FieldType)
);

export type DataTypeVersion = 1;
export const dataTypeVersions: ReadonlyArray<DataTypeVersion> = [1];

export interface DataTypeFieldConfig {
    /**
     * The type of field
    */
    type: FieldType|DeprecatedFieldType;
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
}

export type DataTypeFields = Record<string, DataTypeFieldConfig>;

export interface DataTypeConfig {
    fields: DataTypeFields;
    version: DataTypeVersion;
}

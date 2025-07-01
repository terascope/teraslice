import { Overwrite } from './utility.js';

/**
 * The data type of a field
*/
export enum FieldType {
    Boolean = 'Boolean',
    Boundary = 'Boundary',
    Byte = 'Byte',
    Date = 'Date',
    Domain = 'Domain',
    Double = 'Double',
    Float = 'Float',
    /**
     * @deprecated use GeoPoint or GeoJSON instead
    */
    Geo = 'Geo',
    GeoPoint = 'GeoPoint',
    GeoJSON = 'GeoJSON',
    Hostname = 'Hostname',
    Integer = 'Integer',
    IPRange = 'IPRange',
    IP = 'IP',
    KeywordCaseInsensitive = 'KeywordCaseInsensitive',
    KeywordTokensCaseInsensitive = 'KeywordTokensCaseInsensitive',
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
    /**
     * An ordered-set of values.
    */
    Tuple = 'Tuple'
}

/**
 * @deprecated use the enum FieldType
*/
export type DeprecatedFieldType
    = | 'Boolean'
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

/**
 * A list of all of the Field Types
*/
export const availableFieldTypes: ReadonlyArray<FieldType> = Object.freeze(
    Object.values(FieldType)
);

/**
 * The major DataType config version
*/
export type DataTypeVersion = 1;

/**
 * A list of DataType config versions
*/
export const dataTypeVersions: ReadonlyArray<number> = Object.freeze([1]);

/**
 * A list of valid valid formats for FieldType.Date.
 * date-fns string format can be used, see https://date-fns.org/v2.16.1/docs/format
*/
export enum DateFormat {
    iso_8601 = 'iso_8601',
    epoch_millis = 'epoch_millis',
    epoch = 'epoch',
    seconds = 'seconds',
    milliseconds = 'milliseconds',
}

export enum TimeResolution {
    MILLISECONDS = 'milliseconds',
    SECONDS = 'seconds'
}

/**
 *  The configuration for an individual field
*/
export interface DataTypeFieldConfig {
    /**
     * The type of field
    */
    type: FieldType | DeprecatedFieldType;

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
     * (Not supported by some field types...
     * see indexedRequiredFieldTypes for types that cannot be false)
     * @default true
    */
    indexed?: boolean;

    /**
     * Specify the locale for the field (not compatible with all fields)
     * Must be represented in a Language Tags (BCP 47)
    */
    locale?: string;

    /**
    * Specify the format for a specific fields.
    * Currently this is only support with FieldType.Date
    */
    format?: string;

    /**
     * A temporary flag to fix KeywordCaseInsensitive to be
     * a type keyword with case insensitive .text fields
    */
    use_fields_hack?: boolean;

    /**
     * The default date field used primarily for naming
     * timeseries indices
    */
    is_primary_date?: boolean;

    /**
     * Indicates whether the data has second or millisecond resolutions
     * used with the `is_primary_date`
     */
    time_resolution?: TimeResolution;

    [extra: string]: unknown;
}

/**
 * The DataType fields configuration
*/
export type DataTypeFields = Record<string, DataTypeFieldConfig>;
/**
 * A readonly version of DataType fields configuration
*/
export type ReadonlyDataTypeFields = Record<string, Readonly<DataTypeFieldConfig>>;

/**
 * The DataType fields config with version
*/
export interface DataTypeConfig {
    /**
     *  The fields configuration
    */
    fields: DataTypeFields;

    /**
     * The major version of DataType config, defaults to the latest version.
    */
    version?: number;
}

/**
 * A readonly version of the DataTypeConfig
*/
export type ReadonlyDataTypeConfig = Readonly<Overwrite<DataTypeConfig, {
    /**
     *  The fields configuration
    */
    fields: ReadonlyDataTypeFields;
}>>;

export const indexedRequiredFieldTypes = {
    [FieldType.Domain]: true,
    [FieldType.GeoJSON]: true,
    [FieldType.Hostname]: true,
    [FieldType.KeywordCaseInsensitive]: true,
    [FieldType.KeywordPathAnalyzer]: true,
    [FieldType.KeywordTokensCaseInsensitive]: true,
    [FieldType.KeywordTokens]: true,
    [FieldType.NgramTokens]: true,
};

import {
    DataTypeFieldConfig, FieldType, DataTypeFields,
    ReadonlyDataTypeFields, ReadonlyDataTypeConfig,
    DateFormat, GeoInput, GeoPointInput, GeoShapeRelation,
    TimeResolution
} from '@terascope/types';
import { BinaryToTextEncoding } from 'crypto';
import validator from 'validator';
import { Column } from '../column';

export type { AdjustDateArgs, GetTimeBetweenArgs, InNumberRangeArg } from '@terascope/utils';

export interface FormatDateArgs {
    format?: string|DateFormat;
}

export interface GetTimezoneOffsetArgs {
    timezone: string;
}

export interface IsAfterArgs {
    date: string | number | Date;
}

export interface IsBeforeArgs {
    date: string | number | Date;
}

export interface IsBetweenArgs {
    start: string | number | Date;
    end: string | number | Date;
}

export interface IsDateArgs {
    format?: string|DateFormat;
}

export interface IsEpochArgs {
    allowBefore1970?: boolean;
}

export interface IsEpochMillisArgs {
    allowBefore1970?: boolean;
}

export interface SetDateArgs {
    date: number
}

export interface SetHoursArgs {
    hours: number
}

export interface SetMillisecondsArgs {
    milliseconds: number
}

export interface SetMinutesArgs {
    minutes: number
}

export interface SetMonthArgs {
    month: number
}

export interface SetSecondsArgs {
    seconds: number
}

export interface SetTimezoneArgs {
    timezone: number|string
}

export interface SetYearArgs {
    year: number
}

export interface ToDateArgs {
    format?: string|DateFormat;
}

export interface GeoContainsArgs {
    value: GeoInput;
}

export interface GeoContainsPointArgs {
    point: GeoPointInput;
}

export interface GeoDisjointArgs {
    value: GeoInput;
}
export interface GeoIntersectsArgs {
    value: GeoInput;
}

export interface GeoPointWithinRangeArgs {
    point: GeoPointInput;
    distance: string
}

export interface GeoRelationArgs {
    value: GeoInput;
    relation?: GeoShapeRelation
}

export interface GeoWithinArgs {
    value: GeoInput;
}
export interface PointInBoundingBoxArgs {
    top_left: GeoPointInput;
    bottom_right: GeoPointInput
}

export interface InIPRangeArgs {
    min?: string;
    max?: string;
    cidr?: string;
}

export interface IntToIPArgs {
    version: string | number
}

export interface ToCIDRArgs {
    suffix: number | string
}

export interface ParseJSONArgs {
    type?: FieldType;
    array?: boolean;
    description?: string;
    indexed?: boolean;
    locale?: string;
    format?: string;
    is_primary_date?: boolean;
    time_resolution?: TimeResolution;
    child_config?: DataTypeFields
}

export interface SetDefaultArgs {
    value: unknown;
}

export interface EqualsArgs {
    readonly value: unknown;
}

export interface EmptyArgs {
    /** Trims string input */
    readonly ignoreWhitespace?: boolean;
}

export interface LookupArgs {
    readonly in: Record<string, unknown>
}

export interface AddArgs {
    readonly value: number
}

export interface DivideArgs {
    readonly value: number
}
export interface GreaterThanArgs {
    readonly value: number;
}

export interface GreaterThanOrEqualToArgs {
    readonly value: number;
}

export interface LessThanArgs {
    readonly value: number;
}

export interface LessThanOrEqualToArgs {
    readonly value: number;
}

export interface ModulusArgs {
    readonly value: number
}

export interface MultiplyArgs {
    readonly value: number
}

export interface PowerArgs {
    readonly exp: number;
}

export interface RandomArgs {
    readonly min: number;
    readonly max: number;
}

export interface ToPrecisionArgs {
    readonly digits: number;
    readonly truncate?: boolean;
}

export interface SubtractArgs {
    readonly value: number
}

export interface ContainsArgs {
    readonly substr: string;
}

export interface EncodeConfig {
    algo: string;
    digest?: BinaryToTextEncoding;
}

export interface EncodeSHAConfig {
    hash?: string;
    digest?: BinaryToTextEncoding;
}

export interface EncodeSHA1Config {
    digest?: BinaryToTextEncoding;
}

export interface EndsWithArgs {
    value: string
}

export interface ExtractArgs {
    regex?: string;
    start?: string;
    end?: string;
    global?: boolean;
}

export interface AlphaLocale {
    locale?: validator.AlphaLocale;
}

export interface AlphaNumericLocale {
    locale?: validator.AlphanumericLocale;
}

export interface IsHashArgs {
    algo: string;
}

export interface LengthArgs {
    /** Check to see if it exactly matches size */
    readonly size?: number;
    readonly min?: number;
    readonly max?: number;
}

export interface ISDNCountry {
    country?: string;
}

export interface IsMacArgs {
    delimiter?: string | string[];
}

export interface PostalCodeLocale {
    locale?: validator.PostalCodeLocale;
}

export interface JoinArgs {
    delimiter?: string;
}

export interface ReplaceLiteralArgs {
    search: string;
    replace: string;
}

export interface ReplaceRegexArgs {
    regex: string;
    replace: string;
    ignoreCase?: boolean;
    global?: boolean
}

export interface SplitArgs {
    delimiter?: string;
}

export interface StartsWithArgs {
    value: string
}

export interface TrimArgs {
    chars?: string;
}

export interface TrimEndArgs {
    chars?: string;
}

export interface TrimStartArgs {
    chars?: string;
}

export interface TruncateConfig {
    size: number;
}

export enum FunctionDefinitionType {
    FIELD_TRANSFORM = 'FIELD_TRANSFORM',
    RECORD_TRANSFORM = 'RECORD_TRANSFORM',
    FIELD_VALIDATION = 'FIELD_VALIDATION',
    RECORD_VALIDATION = 'RECORD_TRANSFORM'
}

export enum ProcessMode {
    /** This indicates that it operations on non-nil individual values */
    INDIVIDUAL_VALUES = 'INDIVIDUAL_VALUES',
    /** This indicates that it operations on entire values, including nulls and arrays */
    FULL_VALUES = 'FULL_VALUES'
}

export enum FunctionDefinitionCategory {
    BOOLEAN = 'BOOLEAN',
    GEO = 'GEO',
    JSON = 'JSON',
    NUMERIC = 'NUMERIC',
    OBJECT = 'OBJECT',
    STRING = 'STRING',
    DATE = 'DATE',
    IP = 'IP',
}

export interface FunctionDefinitionExample<T extends Record<string, any>, O = unknown> {
    /**
     * The example arguments passed to the function
    */
    readonly args: T;

    /**
     * The example data type config and children
    */
    readonly config: ReadonlyDataTypeConfig;

    /**
     * The field to validate against and get the config for.
     * Only required for field operations;
    */
    readonly field?: string;

    /**
     * An example input value that will be pretty printed for documentation.
     * @note this is only a single value
    */
    readonly input: unknown;

    /**
     * The outputted value that will be pretty printed for documentation.
     * In the case of validators, this should be either
     * the input or null (which indicates it is invalid)
    */
    readonly output?: O;

    /**
     * Serialize the output for documentation or the function adapter.
     * In the functionTestHarness this won't be called out the result
     * from the dataFrameAdapter
    */
    readonly serialize_output?: (output: O) => unknown;

    /**
     * If this is set to true, the output is not required. If output
     * is specified it should be the error message
    */
    readonly fails?: boolean;

    /**
     * Optionally describe the behavior of this example
    */
    readonly description?: string;
}

export interface FunctionDefinitionConfig<T extends Record<string, any>> {
    /**
     * The name of the function, this should be considered case-insensitive,
     * since some languages like SQL are case insensitive.
    */
    readonly name: string;

    /**
     * Optionally specify other known aliases to this function
    */
    readonly aliases?: readonly string[];

    /** Type of operation that will be preformed */
    readonly type: FunctionDefinitionType;

    /** Used to generate documentation */
    readonly description: string;

    /**
     * The category of operation, for documentation purposes
    */
    readonly category: FunctionDefinitionCategory;

    /**
     * Examples that will be used in the documentation and potentially
     * in the automated tests.
     * FIXME make this non-optional
    */
    readonly examples?: readonly FunctionDefinitionExample<T>[];

    /**
     * Used for validating and defining the types of the input arguments,
     * please include description field when creating the schema
     */
    readonly argument_schema?: DataTypeFields;

    /**
     * Used to determine what of the possible args are required, as DataType configs does not have
     * a mechanism to specify what is required
     */
    readonly required_arguments?: readonly string[];

    /**
     * Can be used in strongly typed contexts to throw early, some types
     * or only compatible with a given operation
     */
    readonly accepts: readonly FieldType[];

    /** Used for additional custom validation of args, called after generic arg validation */
    readonly validate_arguments?: (args: T) => void;
}
export interface FunctionContext<T extends Record<string, any> = Record<string, unknown>> {
    readonly args: T,
    readonly inputConfig?: DataTypeFieldAndChildren,
    readonly outputConfig?: DataTypeFieldAndChildren,
    readonly parent: Column<unknown>|unknown[]
}

export interface DynamicFrameFunctionContext<
    T extends Record<string, any> = Record<string, unknown>
> {
    readonly args: (index: number) => T,
    readonly inputConfig?: DataTypeFieldAndChildren,
    readonly outputConfig?: DataTypeFieldAndChildren,
    readonly parent: Column<unknown>
}

export interface DynamicFunctionContext<T extends Record<string, any> = Record<string, unknown>> {
    readonly args: (index: number) => T,
    readonly inputConfig?: DataTypeFieldAndChildren,
    readonly outputConfig?: DataTypeFieldAndChildren,
    readonly parent: unknown[]
}

export interface InitialFunctionContext<T extends Record<string, any> = Record<string, unknown>> {
    readonly args: T | ((index: number) => T),
    readonly inputConfig?: DataTypeFieldAndChildren,
    readonly preserveNulls: boolean,
    readonly preserveEmptyObjects: boolean,
    readonly field?: string
}

export interface FieldValidateConfig<
    T extends Record<string, any> = Record<string, unknown>
> extends FunctionDefinitionConfig<T> {
    readonly type: FunctionDefinitionType.FIELD_VALIDATION;
    readonly process_mode: ProcessMode;
    readonly create: (config: FunctionContext<T>) => (value: unknown, index: number) => boolean;
}

export interface FieldTransformConfig<
    T extends Record<string, any> = Record<string, unknown>
> extends FunctionDefinitionConfig<T> {
    readonly type: FunctionDefinitionType.FIELD_TRANSFORM,
    readonly process_mode: ProcessMode,
    readonly output_type?: (
        inputConfig: DataTypeFieldAndChildren,
        args: T
    ) => DataTypeFieldAndChildren;
    readonly create: (config: FunctionContext<T>) => (value: unknown, index: number) => unknown;
}

export interface RecordTransformConfig<
    T extends Record<string, any> = Record<string, unknown>
> extends FunctionDefinitionConfig<T> {
    readonly type: FunctionDefinitionType.RECORD_TRANSFORM,
    readonly output_type: (
        inputConfig: ReadonlyDataTypeFields,
        args?: T
    ) => ReadonlyDataTypeFields,
    readonly create: (
        config: FunctionContext<T>
    ) => (value: Record<string, unknown>, index: number) => Record<string, unknown>
}

export interface RecordValidationConfig<
    T extends Record<string, any> = Record<string, unknown>
> extends FunctionDefinitionConfig<T> {
    readonly type: FunctionDefinitionType.RECORD_VALIDATION,
    readonly create: (config: FunctionContext<T>) =>
    (value: Record<string, unknown>, index: number) => boolean
}

export interface OutputType<T> {
    output_type: (
        inputConfig: DataTypeFieldAndChildren,
        args?: T
    ) => DataTypeFieldAndChildren
}

export interface DataTypeFieldAndChildren {
    readonly field_config: Readonly<DataTypeFieldConfig>,
    readonly child_config?: ReadonlyDataTypeFields
}

// TODO: verify this type
export interface FunctionConfigRepository {
    readonly [key: string]: FunctionDefinitionConfig<Record<string, unknown>>;
}

export function isFieldValidation<T extends Record<string, any>>(
    input: FunctionDefinitionConfig<T>
): input is FieldValidateConfig<T> {
    return input && input.type === FunctionDefinitionType.FIELD_VALIDATION;
}

export function isFieldTransform<T extends Record<string, any>>(
    input: FunctionDefinitionConfig<T>
): input is FieldTransformConfig<T> {
    return input && input.type === FunctionDefinitionType.FIELD_TRANSFORM;
}

export function isFieldOperation<T extends Record<string, any>>(
    input: FunctionDefinitionConfig<T>
): input is (FieldValidateConfig<T> | FieldValidateConfig<T>) {
    return isFieldValidation(input) || isFieldTransform(input);
}

export function isRecordTransform<T extends Record<string, any>>(
    input: FunctionDefinitionConfig<T>
): input is RecordTransformConfig<T> {
    return input && input.type === FunctionDefinitionType.RECORD_TRANSFORM;
}

export function isRecordValidation<T extends Record<string, any>>(
    input: FunctionDefinitionConfig<T>
): input is RecordValidationConfig<T> {
    return input && input.type === FunctionDefinitionType.RECORD_VALIDATION;
}

export function isTransformOperation<T extends Record<string, any>>(
    input: FunctionDefinitionConfig<T>
): input is (RecordTransformConfig<T> | FieldTransformConfig<T>) {
    return isFieldTransform(input) || isRecordValidation(input);
}

const numericTypes = [
    FieldType.Long,
    FieldType.Number,
    FieldType.Byte,
    FieldType.Double,
    FieldType.Float,
    FieldType.Integer,
    FieldType.Short
];

export function isNumericType(fieldConfig: Readonly<DataTypeFieldConfig>): boolean {
    return numericTypes.includes(fieldConfig.type as FieldType);
}

import {
    DataTypeFieldConfig, FieldType, DataTypeFields,
    ReadonlyDataTypeFields, ReadonlyDataTypeConfig
} from '@terascope/types';

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
    IP = 'IP'
}

export interface FunctionDefinitionExample<T extends Record<string, any>> {
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
    readonly output?: unknown;

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

export interface FieldValidateConfig<
    T extends Record<string, any> = Record<string, unknown>
> extends FunctionDefinitionConfig<T> {
    readonly type: FunctionDefinitionType.FIELD_VALIDATION;
    readonly process_mode: ProcessMode;
    readonly create: (
        args: T,
        inputConfig?: DataTypeFieldAndChildren,
    ) => (value: unknown) => boolean;
}

export interface FieldTransformConfig<
    T extends Record<string, any> = Record<string, unknown>
> extends FunctionDefinitionConfig<T> {
    readonly type: FunctionDefinitionType.FIELD_TRANSFORM,
    readonly process_mode: ProcessMode,
    readonly output_type?: (
        inputConfig: DataTypeFieldAndChildren,
        args?: T
    ) => DataTypeFieldAndChildren;
    readonly create: (
        args: T,
        inputConfig?: DataTypeFieldAndChildren,
        outputConfig?: DataTypeFieldAndChildren,
    ) => (value: unknown) => unknown;
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
        args: T,
        inputConfig?: ReadonlyDataTypeFields,
        outputConfig?: ReadonlyDataTypeFields,
    ) => (value: Record<string, unknown>) => Record<string, unknown>
}

export interface RecordValidationConfig<
    T extends Record<string, any> = Record<string, unknown>
> extends FunctionDefinitionConfig<T> {
    readonly type: FunctionDefinitionType.RECORD_VALIDATION,
    readonly create: (
        args: T,
        inputConfig?: ReadonlyDataTypeFields,
        outputConfig?: ReadonlyDataTypeFields,
    ) => (value: Record<string, unknown>) => boolean
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

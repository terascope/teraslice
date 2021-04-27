import { DataTypeFieldConfig, FieldType, DataTypeFields } from '@terascope/types';

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

export interface FunctionDefinitionConfig<T extends Record<string, any>> {
    name: string,
    /** Type of operation that will be preformed */
    type: FunctionDefinitionType,
    /** Used to generate documentation */
    description: string,
    /** Used for validating and defining the types of the input arguments,
     * please include description field when creating the schema */
    argument_schema?: DataTypeFields,
    /** Used to determine what of the possible args are required, as DataType configs does not have
     * a mechanism to specify what is required
     */
    required_arguments?: string[]
    /** Can be used in strongly typed contexts to throw early, some types
     * or only compatible with a given operation
     */
    accepts: FieldType[],
    /** Used for additional custom validation of args, called after generic arg validation */
    validate_arguments?: (args: T) => void
}

export interface FieldValidateConfig<
    T extends Record<string, any> = Record<string, unknown>
> extends FunctionDefinitionConfig<T> {
    type: FunctionDefinitionType.FIELD_VALIDATION,
    process_mode: ProcessMode,
    create: (
        args: T,
        inputConfig?: DataTypeFieldAndChildren,
    ) => (value: unknown) => boolean
}

export interface FieldTransformConfig<
    T extends Record<string, any> = Record<string, unknown>
> extends FunctionDefinitionConfig<T> {
    type: FunctionDefinitionType.FIELD_TRANSFORM,
    process_mode: ProcessMode,
    output_type?: (
        inputConfig: DataTypeFieldAndChildren,
        args?: T
    ) => DataTypeFieldAndChildren,
    create: (
        args: T,
        inputConfig?: DataTypeFieldAndChildren,
        outputConfig?: DataTypeFieldAndChildren,
    ) => (value: unknown) => unknown
}

export interface RecordTransformConfig<
    T extends Record<string, any> = Record<string, unknown>
> extends FunctionDefinitionConfig<T> {
    type: FunctionDefinitionType.RECORD_TRANSFORM,
    output_type: (
        inputConfig: DataTypeFieldAndChildren,
        args?: T
    ) => DataTypeFieldAndChildren,
    create: (
        args: T,
        inputConfig?: DataTypeFieldAndChildren,
        outputConfig?: DataTypeFieldAndChildren,
    ) => (value: Record<string, unknown>) => Record<string, unknown>
}

export interface RecordValidationConfig<
    T extends Record<string, any> = Record<string, unknown>
> extends FunctionDefinitionConfig<T> {
    type: FunctionDefinitionType.RECORD_VALIDATION,
    create: (
        args: T,
        inputConfig?: DataTypeFieldAndChildren,
        outputConfig?: DataTypeFieldAndChildren,
    ) => (value: Record<string, unknown>) => boolean
}

export interface OutputType<T> {
    output_type: (
        inputConfig: DataTypeFieldAndChildren,
        args?: T
    ) => DataTypeFieldAndChildren
}

export interface DataTypeFieldAndChildren {
    field_config: DataTypeFieldConfig,
    child_config?: DataTypeFields
}
// Make a separate one for record level adapters
export type FunctionDefinitions = FieldValidateConfig<Record<string, unknown>>
| FieldTransformConfig<Record<string, unknown>>
| RecordValidationConfig<Record<string, unknown>>
| RecordTransformConfig<Record<string, unknown>>

// TODO: verify this type
export interface FunctionConfigRepository {
    [key: string]: FunctionDefinitions;
}

export function isFieldValidation(
    input: FunctionDefinitionConfig<Record<string, unknown>>
): input is FieldValidateConfig {
    return input && input.type === FunctionDefinitionType.FIELD_VALIDATION;
}

export function isFieldTransform(
    input: FunctionDefinitionConfig<Record<string, unknown>>
): input is FieldTransformConfig {
    return input && input.type === FunctionDefinitionType.FIELD_TRANSFORM;
}

export function isFieldOperation(
    input: FunctionDefinitionConfig<Record<string, unknown>>
): input is (FieldValidateConfig | FieldValidateConfig) {
    return isFieldValidation(input) || isFieldTransform(input);
}

export function isRecordTransform(
    input: FunctionDefinitionConfig<Record<string, unknown>>
): input is RecordTransformConfig {
    return input && input.type === FunctionDefinitionType.RECORD_TRANSFORM;
}

export function isRecordValidation(
    input: FunctionDefinitionConfig<Record<string, unknown>>
): input is RecordValidationConfig {
    return input && input.type === FunctionDefinitionType.RECORD_VALIDATION;
}

export function isTransformOperation(
    input: FunctionDefinitionConfig<Record<string, unknown>>
): input is (RecordTransformConfig | FieldTransformConfig) {
    return isFieldTransform(input) || isRecordValidation(input);
}

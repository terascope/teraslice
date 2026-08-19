import {
    DataTypeFieldConfig, FieldType, DataTypeFields,
    ReadonlyDataTypeFields, ReadonlyDataTypeConfig,
} from '@terascope/types';
import { Column } from '../column/index.js';

export type { InNumberRangeArg } from '@terascope/core-utils';

export enum FunctionDefinitionType {
    FIELD_TRANSFORM = 'FIELD_TRANSFORM',
    RECORD_TRANSFORM = 'RECORD_TRANSFORM',
    FIELD_VALIDATION = 'FIELD_VALIDATION',
    // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
    RECORD_VALIDATION = 'RECORD_TRANSFORM'
}

export enum ProcessMode {
    /** This indicates that it operations on non-nil individual values */
    INDIVIDUAL_VALUES = 'INDIVIDUAL_VALUES',
    /** This indicates that it operations on entire values, including nulls and arrays */
    FULL_VALUES = 'FULL_VALUES',
    /** This indicates a noop, usually this is for metadata/datatype changes */
    NONE = 'NONE'
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

    /**
     * Setting this to true will be exclude it from the
     * documentation
    */
    readonly test_only?: boolean;
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

    /**
     * How to run this function as a SQL EXPRESSION instead of a JavaScript UDF.
     *
     * **Why this belongs here.** A `FunctionDefinitionConfig` is the single definition of a
     * function's behaviour - name, aliases, argument schema, accepted types, what the field
     * becomes, and the implementation - and spaces turns these into GraphQL directives, so they
     * are the public surface. How a function is EXECUTED is a property of the function, so it is
     * declared next to everything else about it rather than in a lookup table that could drift.
     *
     * **Why it is worth having.** A JS UDF costs ~178 ns per value of pure marshalling and runs
     * strictly single-threaded (the node binding blocks the DuckDB worker thread until JS
     * returns), while native SQL is 1-2 ns and uses 9-11 cores. Measured 2026-08-18: 18x on a
     * five-function pipeline at 5M rows, 125x on an isolated aggregate.
     *
     * **Nothing is promoted by inspection.** An emission is only correct if it is byte-equal to
     * this function's own UDF over a battery of values, and the two most obvious candidates in the
     * catalogue were NOT: JS `trim()` strips all Unicode whitespace where DuckDB's one-argument
     * `trim` strips only spaces, and `toUpperCase` uses full case mapping where `upper()` uses
     * simple mapping (`'ß'` -> `SS` in JS, `ẞ` in SQL). `sql-emission-spec.ts` is the gate.
    */
    readonly sql?: SqlEmission<T>;
}

/**
 * A function's SQL form.
 *
 * `expression` builds SQL for ONE value rather than for the column, because the caller decides how
 * the value is reached: it is the column for a scalar field, and the lambda variable inside a
 * `list_transform` for an array field under `INDIVIDUAL_VALUES`. Building per value means the array
 * case needs nothing extra here.
*/
export interface SqlEmission<T extends Record<string, any>> {
    /** Builds the expression. Must be NULL-safe: a null input has to produce null. */
    readonly expression: (ctx: SqlEmissionContext<T>) => string;

    /**
     * Field types this emission is valid for. Defaults to the function's `accepts`.
     *
     * Present because an emission is often only right for SOME accepted types - a function that
     * takes both `String` and `Number` may have a native equivalent for one and not the other.
    */
    readonly types?: readonly FieldType[];

    /**
     * Set when the emission agrees with the UDF to within a few ULP rather than bit-exactly.
     *
     * **Only for transcendental functions, and it is not a licence to be sloppy.** IEEE 754 does not
     * specify exact results for `sin`, `cos`, `ln` and friends - only for `sqrt` and the algebraic
     * operations - so DuckDB's libm and V8's implementation legitimately differ in the last bit:
     * measured, `cos` over the battery gave `0.9910848718142532` where JavaScript gave
     * `...533`. Requiring bit-equality there would reject every transcendental function forever,
     * while requiring nothing would hide a real error, so the gate compares them with a relative
     * tolerance of a few ULP and demands exactness everywhere else.
     *
     * A function whose result must round-trip exactly - anything algebraic, anything producing an
     * integer, anything a caller might compare for equality - must NOT set this.
    */
    readonly approximate?: boolean;

    /**
     * Set when `expression` calls `ctx.udf`, so the adapter knows it must still register the
     * JavaScript implementation.
     *
     * **This is what makes a guarded fast path possible**, which is the difference between
     * promoting a function and giving up on it: `toUpperCase` is `upper()` for ASCII and needs
     * JavaScript's full case mapping for anything else, so it emits
     * `CASE WHEN <ascii> THEN upper(x) ELSE udf(x) END` and the UDF is called only for the values
     * that need it. When this is NOT set, no UDF is registered at all and the JS boundary is gone.
    */
    readonly needs_udf_fallback?: boolean;
}

export interface SqlEmissionContext<T extends Record<string, any>> {
    /** SQL for ONE already-typed value: the quoted column, or a lambda variable. */
    readonly value: string;
    readonly args: T;
    readonly inputConfig: DataTypeFieldAndChildren;
    readonly outputConfig: DataTypeFieldAndChildren;
    /**
     * Calls this function's JavaScript UDF for `value`.
     *
     * Only usable when `needs_udf_fallback` is set - otherwise no UDF exists and calling this
     * throws, loudly, at plan time rather than producing SQL that references nothing.
    */
    readonly udf: (value: string) => string;
}
export interface FunctionContext<T extends Record<string, any> = Record<string, unknown>> {
    readonly args: T;
    readonly inputConfig?: DataTypeFieldAndChildren;
    readonly outputConfig?: DataTypeFieldAndChildren;
    readonly parent: Column<unknown> | unknown[];
}

export interface DynamicFrameFunctionContext<
    T extends Record<string, any> = Record<string, unknown>
> {
    readonly args: (index: number) => T;
    readonly inputConfig?: DataTypeFieldAndChildren;
    readonly outputConfig?: DataTypeFieldAndChildren;
    readonly parent: Column<unknown>;
}

export interface DynamicFunctionContext<T extends Record<string, any> = Record<string, unknown>> {
    readonly args: (index: number) => T;
    readonly inputConfig?: DataTypeFieldAndChildren;
    readonly outputConfig?: DataTypeFieldAndChildren;
    readonly parent: unknown[];
}

export interface InitialFunctionContext<T extends Record<string, any> = Record<string, unknown>> {
    readonly args: T | ((index: number) => T);
    readonly inputConfig?: DataTypeFieldAndChildren;
    readonly preserveNulls: boolean;
    readonly preserveEmptyObjects: boolean;
    readonly field?: string;
}

export interface FieldValidateConfig<
    T extends Record<string, any> = Record<string, unknown>
> extends FunctionDefinitionConfig<T> {
    readonly type: FunctionDefinitionType.FIELD_VALIDATION;
    readonly process_mode: ProcessMode;
    readonly create: (config: FunctionContext<T>) => (value: unknown, index: number) => boolean;
    readonly output_type?: (
        inputConfig: DataTypeFieldAndChildren,
        args: T
    ) => DataTypeFieldAndChildren;
}

export interface FieldTransformConfig<
    T extends Record<string, any> = Record<string, unknown>
> extends FunctionDefinitionConfig<T> {
    readonly type: FunctionDefinitionType.FIELD_TRANSFORM;
    readonly process_mode: ProcessMode;
    readonly output_type?: (
        inputConfig: DataTypeFieldAndChildren,
        args: T
    ) => DataTypeFieldAndChildren;
    readonly create: (config: FunctionContext<T>) => (value: unknown, index: number) => unknown;
}

export interface FieldMetaTransform<
    T extends Record<string, any> = Record<string, unknown>
> extends FunctionDefinitionConfig<T> {
    readonly type: FunctionDefinitionType.FIELD_TRANSFORM;
    readonly process_mode: ProcessMode.NONE;
    readonly create: (config: FunctionContext<T>) => void;
    readonly output_type?: (
        inputConfig: DataTypeFieldAndChildren,
        args: T
    ) => DataTypeFieldAndChildren;
}

export interface RecordTransformConfig<
    T extends Record<string, any> = Record<string, unknown>
> extends FunctionDefinitionConfig<T> {
    readonly type: FunctionDefinitionType.RECORD_TRANSFORM;
    readonly output_type: (
        inputConfig: ReadonlyDataTypeFields,
        args?: T
    ) => ReadonlyDataTypeFields;
    readonly create: (
        config: FunctionContext<T>
    ) => (value: Record<string, unknown>, index: number) => Record<string, unknown>;
}

export interface RecordValidationConfig<
    T extends Record<string, any> = Record<string, unknown>
> extends FunctionDefinitionConfig<T> {
    readonly type: FunctionDefinitionType.RECORD_VALIDATION;
    readonly create: (config: FunctionContext<T>) =>
    (value: Record<string, unknown>, index: number) => boolean;
}

export interface OutputType<T> {
    output_type: (
        inputConfig: DataTypeFieldAndChildren,
        args?: T
    ) => DataTypeFieldAndChildren;
}

export interface DataTypeFieldAndChildren {
    readonly field_config: Readonly<DataTypeFieldConfig>;
    readonly child_config?: ReadonlyDataTypeFields;
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

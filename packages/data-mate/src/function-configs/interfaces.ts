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
     * How to run this function as a SQL expression instead of a JavaScript UDF.
     *
     * It is declared on the function definition, next to the name, arguments, accepted types and
     * implementation, so it cannot drift from the rest of the definition. These definitions are
     * also exposed as GraphQL directives, so they are the public surface.
     *
     * A JS UDF costs ~178 ns per value and runs single-threaded, because the Node binding blocks
     * DuckDB's worker thread until JavaScript returns. Native SQL costs 1-2 ns per value and runs
     * in parallel.
     *
     * An expression must return exactly what the function's UDF returns, and
     * `test/teal-frame/sql-emission-spec.ts` checks that. Obvious translations often differ: JS
     * `trim()` strips all Unicode whitespace while DuckDB's one-argument `trim` strips only spaces,
     * and `toUpperCase` uses full case mapping while `upper()` uses simple mapping (`'ß'` becomes
     * `SS` in JS and `ẞ` in SQL).
    */
    readonly sql?: SqlEmission<T>;
}

/**
 * A function's SQL form.
 *
 * `expression` builds SQL for one value rather than for the column, because the caller decides how
 * the value is reached: the column for a scalar field, or the lambda variable inside a
 * `list_transform` for an array field under `INDIVIDUAL_VALUES`. Array fields therefore need
 * nothing extra here.
*/
export interface SqlEmission<T extends Record<string, any>> {
    /** Builds the expression. It must be null-safe: a null input must produce null. */
    readonly expression: (ctx: SqlEmissionContext<T>) => string;

    /**
     * Set when a `Date` result is already the stored date value, `{ ms, tz_offset }`, rather than a
     * TIMESTAMP, so the adapter must not wrap it (wrapping would set the offset to null). Only the
     * functions that attach an offset need it: `setTimezone`, `toTimeZone` and
     * `toTimeZoneUsingLocation`. See `teal-frame/date-value.ts`.
    */
    readonly returns_date_value?: boolean;

    /**
     * Field types this expression is valid for. Defaults to the function's `accepts`.
     *
     * A function that accepts both `String` and `Number` may have a native equivalent for only
     * one of them.
    */
    readonly types?: readonly FieldType[];

    /**
     * Whether this expression is valid for these arguments.
     *
     * `types` narrows by column type; this narrows by argument. For example, `encodeSHA` takes a
     * `hash` and a `digest`: DuckDB has `md5`, `sha1` and `sha256` but no `sha512`, and returns
     * only hex, so only some combinations can run as SQL. Returning false uses the UDF for that
     * call.
    */
    readonly applies?: (args: T, inputConfig: DataTypeFieldAndChildren) => boolean;

    /**
     * Set when the expression matches the UDF to within a few ULP rather than exactly.
     *
     * Only for transcendental functions. IEEE 754 requires exact results only for `sqrt` and the
     * basic arithmetic operations, so DuckDB's libm and V8 can differ in the last bit for `sin`,
     * `cos`, `ln` and similar (for one input, `cos` gives `0.9910848718142532` in SQL and `...533`
     * in JavaScript). The parity test compares these with a relative tolerance of a few ULP and
     * requires exact equality everywhere else.
     *
     * Never set this for a function whose result must round-trip exactly: anything algebraic,
     * anything that returns an integer, or anything a caller might compare for equality.
    */
    readonly approximate?: boolean;

    /**
     * Set when `expression` calls `ctx.udf`, so the adapter still registers the JavaScript
     * implementation.
     *
     * This allows a guarded fast path. `toUpperCase` is `upper()` for ASCII but needs JavaScript's
     * full case mapping otherwise, so its SQL is
     * `CASE WHEN <ascii> THEN upper(x) ELSE udf(x) END` and the UDF runs only for the values that
     * need it. When this is not set, no UDF is registered.
    */
    readonly needs_udf_fallback?: boolean;
}

export interface SqlEmissionContext<T extends Record<string, any>> {
    /**
     * SQL for one already-typed value: the quoted column, or a lambda variable.
     *
     * For a `Date` it is a TIMESTAMP of the local wall time (the instant shifted by the row's
     * offset, or the instant itself when there is no offset), which is what `DataFrame`'s date
     * functions read from a `DateTuple`. Dates are stored as `{ ms, tz_offset }`; see
     * `teal-frame/date-value.ts`.
    */
    readonly value: string;
    /**
     * For a `Date` only: a TIMESTAMP of the instant, ignoring any offset, for a function that
     * reads UTC (`getUTCHours`) or compares instants.
    */
    readonly instant?: string;
    readonly args: T;
    readonly inputConfig: DataTypeFieldAndChildren;
    readonly outputConfig: DataTypeFieldAndChildren;
    /**
     * Calls this function's JavaScript UDF on `value`.
     *
     * Only usable when `needs_udf_fallback` is set. Otherwise no UDF exists, and calling this
     * throws at plan time instead of producing SQL that references a missing function.
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

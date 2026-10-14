import { isNil } from '@terascope/core-utils';
import { DataTypeFieldConfig, DataTypeFields, FieldType } from '@terascope/types';
import { validateFunctionArgs } from '../argument-validator/index.js';
import { validateAccepts, getFieldTypesFromFieldConfigAndChildConfig } from '../../column/index.js';
import {
    FunctionDefinitionConfig, FieldTransformConfig, FieldValidateConfig,
    isFieldTransform, isFieldValidation, ProcessMode, DataTypeFieldAndChildren,
    SqlEmission,
} from '../../function-configs/interfaces.js';
import { inspect } from 'node:util';
import { quoteIdentifier, quoteLiteral } from '@terascope/sql-builder';
import { ScalarFunctionImpl } from '../../teal-frame/scalar-function.js';
import { registerScalarFunction, makeBigIntInputNormalizer } from '../../teal-frame/index.js';
import { coerceToType } from '../../builder/type-coercion.js';
import { instantSQL, localSQL, fromTimestampSQL } from '../../teal-frame/date-value.js';

export interface TealFrameAdapterOptions<T extends Record<string, any>> {
    /** The column the function applies to. */
    field: string;
    /** The column's field config at this step. */
    inputConfig: DataTypeFieldAndChildren;
    /**
     * Function arguments, bound once at registration.
     *
     * As with `dataFrameAdapter`'s static arguments, they are constant for the whole query, so
     * `create()` is called once and its closure becomes the UDF body. Per-row arguments
     * (`args: (rowIndex) => ...` in `dataFrameAdapter`) are not supported; a row-dependent
     * argument would have to be passed as an extra column.
    */
    args?: T;
    /** Database to register on. Defaults to the process-wide one. */
    database?: string;
    /**
     * Use the function's `sql` definition when it has one. Defaults to true.
     *
     * Setting it to false forces the UDF path, so tests can compare the two paths, benchmarks
     * can time both, and a faulty SQL definition can be bypassed without a new release.
    */
    preferSql?: boolean;
}

export interface TealFrameAdapterResult {
    /**
     * The SQL expression that applies the function to the column, ready to use as
     * `select({ [name]: expression }, config)`.
    */
    expression: string;
    /**
     * The column's field config after this step, from the function's `output_type`. Pass it as
     * the next step's `inputConfig` to track a field whose type changes.
    */
    outputConfig: DataTypeFieldAndChildren;
    /**
     * The registered UDF name, or undefined when no UDF was needed (an unchanged
     * `ProcessMode.NONE` cast, or a `sql` definition without a UDF fallback).
    */
    functionName?: string;
    /**
     * How the expression computes the value: native SQL, SQL with a UDF fallback for values SQL
     * cannot handle, or the UDF for every value.
     *
     * Exposed so tests and benchmarks can check which path ran; the results look the same
     * either way.
    */
    dispatch: 'sql' | 'sql+udf' | 'udf' | 'none';
}

/**
 * Applies a `FunctionDefinitionConfig` to a DuckDB column; the DuckDB counterpart of
 * `dataFrameAdapter`.
 *
 * The function configs define each function's name, aliases, arguments, accepted types,
 * `output_type` and implementation. This adapter reuses them instead of restating any of it,
 * so both frames behave the same.
 *
 * The behavior mirrors `dataFrameAdapter`. Keep the two in sync.
 */
export async function tealFrameAdapter<T extends Record<string, any> = Record<string, unknown>>(
    fnDef: FunctionDefinitionConfig<T>,
    options: TealFrameAdapterOptions<T>
): Promise<TealFrameAdapterResult> {
    if (isFieldValidation(fnDef)) {
        return adaptValidation(fnDef as FieldValidateConfig<T>, options);
    }
    if (isFieldTransform(fnDef)) {
        return adaptTransform(fnDef as FieldTransformConfig<T>, options);
    }
    throw new Error(
        `Function definition "${fnDef.name}" (type: ${fnDef.type}) is not supported`
    );
}

async function adaptTransform<T extends Record<string, any>>(
    fnDef: FieldTransformConfig<T>,
    options: TealFrameAdapterOptions<T>
): Promise<TealFrameAdapterResult> {
    const { field, inputConfig } = options;
    const args = resolveArgs(fnDef, options.args);

    // A transform throws on a type mismatch, while a validation clears the column,
    // matching dataFrameAdapter.
    const err = acceptsError(fnDef, inputConfig);
    if (err) throw err;

    const outputConfig = fnDef.output_type
        ? fnDef.output_type(inputConfig, args)
        : inputConfig;

    const column = quoteIdentifier(field);

    if (fnDef.process_mode === ProcessMode.NONE) {
        return adaptTypeChange(fnDef, options, args, outputConfig);
    }

    const fullValues = fnDef.process_mode === ProcessMode.FULL_VALUES;
    const emission = emissionFor(fnDef, inputConfig, options.preferSql, args);

    // pure SQL: no UDF is registered, so there is no JS call per value (~178 ns each,
    // single-threaded)
    if (emission && !emission.needs_udf_fallback) {
        return {
            expression: applyToValues(
                (value) => emitted(emission, value, {
                    args, inputConfig, outputConfig, udf: noUdf(fnDef.name), transform: true,
                }),
                column,
                inputConfig,
                fullValues
            ),
            outputConfig,
            dispatch: 'sql',
        };
    }

    const resultConfig = udfResult(fnDef, args, inputConfig, outputConfig, fullValues);
    const parameter = udfParameter(inputConfig, fullValues);
    /** Builds one argument set's implementation, coercing results as a `DataFrame` Builder does. */
    const implFor = (a: T): ScalarFunctionImpl => {
        const out = fnDef.output_type ? fnDef.output_type(inputConfig, a) : inputConfig;
        return coercingResult(
            fnDef.create({ args: a, inputConfig, outputConfig: out } as any) as ScalarFunctionImpl,
            udfResult(fnDef, a, inputConfig, out, fullValues)
        );
    };
    const argsText = argumentsText(args);

    const functionName = await registerScalarFunction({
        name: udfName(fnDef.name, [
            'transform', parameter, inputConfig.child_config, resultConfig, fullValues,
        ], argsText === undefined ? args : undefined),
        parameter,
        parameterChildren: inputConfig.child_config,
        returns: resultConfig.field_config as DataTypeFieldConfig,
        returnsChildren: resultConfig.child_config,
        ...implementation(args, argsText, implFor),
        callWithNull: fullValues,
        database: options.database,
    });

    const callUdf = udfCall(functionName, argsText);
    const build = emission
        ? (value: string) => emitted(emission, value, {
            args, inputConfig, outputConfig, udf: callUdf, transform: true,
        })
        : callUdf;

    return {
        expression: applyToValues(build, column, inputConfig, fullValues),
        outputConfig,
        functionName,
        dispatch: emission ? 'sql+udf' : 'udf',
    };
}

/**
 * Handles `ProcessMode.NONE` (only `cast` uses it), which changes the field's config.
 *
 * `dataFrameAdapter` copies each value into a Builder for the new config, and the Builder coerces
 * it: casting `'21.223'` to Integer gives `21`, casting to an array gives `[21]`, and casting an
 * invalid IP throws. So when the type changes, this registers a UDF that runs the same
 * `coerceToType`.
 *
 * When only metadata changes (`description`, `locale` and so on) the values are already correct,
 * so the column is returned unchanged and no UDF is registered.
*/
async function adaptTypeChange<T extends Record<string, any>>(
    fnDef: FieldTransformConfig<T>,
    options: TealFrameAdapterOptions<T>,
    args: T,
    outputConfig: DataTypeFieldAndChildren
): Promise<TealFrameAdapterResult> {
    const { field, inputConfig } = options;
    const column = quoteIdentifier(field);
    if (typeShape(inputConfig) === typeShape(outputConfig)) {
        return { expression: column, outputConfig, dispatch: 'none' };
    }

    const coerce = resultCoercion(outputConfig);
    // the coercion depends only on the two configs, so they (not the arguments) name the UDF
    const functionName = await registerScalarFunction({
        name: udfName(fnDef.name, [
            'type change',
            inputConfig.field_config,
            inputConfig.child_config ?? null,
            outputConfig.field_config,
            outputConfig.child_config ?? null,
        ]),
        parameter: inputConfig.field_config as DataTypeFieldConfig,
        parameterChildren: inputConfig.child_config,
        returns: outputConfig.field_config as DataTypeFieldConfig,
        returnsChildren: outputConfig.child_config,
        fn: (value) => coerce(value),
        database: options.database,
    });

    return {
        expression: `${functionName}(${column})`,
        outputConfig,
        functionName,
        dispatch: 'udf',
    };
}

/**
 * Coerces a function result into its output config as a `DataFrame` Builder does (every
 * Builder's `_valueFrom` is `coerceToType(config)`). A result that does not match its
 * `output_type` is converted or throws the same way: `setDefault` or `toJSON` on an Integer
 * column gives `"5"`, and `ceil(1e21)` into an Integer throws.
 *
 * The bigint normalizer runs first, as on ingest: `toBigIntOrThrow` adds 1 to a value it parses
 * past 2^53 but returns a bigint unchanged, and the value converter later subtracts 1. Passing a
 * large bigint as a decimal string keeps it exact. See `makeBigIntInputNormalizer`.
*/
function resultCoercion(config: DataTypeFieldAndChildren): (value: unknown) => unknown {
    const fieldConfig = config.field_config as DataTypeFieldConfig;
    const childConfig = config.child_config as DataTypeFields | undefined;
    const coerce = coerceToType(fieldConfig, childConfig);
    const normalize = makeBigIntInputNormalizer(fieldConfig, childConfig);

    return (value) => {
        if (value == null) return value;
        return coerce(normalize ? normalize(value) : value);
    };
}

function coercingResult(
    impl: ScalarFunctionImpl,
    config: DataTypeFieldAndChildren
): ScalarFunctionImpl {
    const coerce = resultCoercion(config);
    return (value, index) => coerce(impl(value, index));
}

/** A key for the parts of a config that affect stored values: type, `array` and children. */
function typeShape({ field_config, child_config }: DataTypeFieldAndChildren): string {
    const shape = (config: Pick<DataTypeFieldConfig, 'type' | 'array'>) => [
        config.type, config.array === true,
    ];
    return JSON.stringify([
        shape(field_config as DataTypeFieldConfig),
        Object.entries(child_config ?? {})
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([name, config]) => [name, shape(config)]),
    ]);
}

async function adaptValidation<T extends Record<string, any>>(
    fnDef: FieldValidateConfig<T>,
    options: TealFrameAdapterOptions<T>
): Promise<TealFrameAdapterResult> {
    const { field, inputConfig } = options;
    const args = resolveArgs(fnDef, options.args);
    const column = quoteIdentifier(field);

    // A validation on a mismatched type clears the column rather than throwing, as
    // `validateColumnData` does with `column.clearAll()`.
    if (acceptsError(fnDef, inputConfig)) {
        return { expression: 'NULL', outputConfig: inputConfig, dispatch: 'none' };
    }

    // A validation never changes the field type; dataFrameAdapter keeps the input's config.
    const outputConfig = inputConfig;

    const fullValues = fnDef.process_mode === ProcessMode.FULL_VALUES;
    const emission = emissionFor(fnDef, inputConfig, options.preferSql, args);

    if (emission && !emission.needs_udf_fallback) {
        return {
            expression: nullUnlessValid(
                (value) => emitted(emission, value, {
                    args, inputConfig, outputConfig, udf: noUdf(fnDef.name), transform: false,
                }),
                column,
                perElement(inputConfig, fullValues)
            ),
            outputConfig,
            dispatch: 'sql',
        };
    }

    const parameter = udfParameter(inputConfig, fullValues);
    const predicateFor = (a: T) => (
        fnDef.create({ args: a, inputConfig } as any) as ScalarFunctionImpl
    );
    const argsText = argumentsText(args);

    const functionName = await registerScalarFunction({
        name: udfName(fnDef.name, [
            'validation', parameter, inputConfig.child_config,
        ], argsText === undefined ? args : undefined),
        parameter,
        parameterChildren: inputConfig.child_config,
        returns: { type: FieldType.Boolean },
        ...implementation(args, argsText, predicateFor),
        callWithNull: fullValues,
        database: options.database,
    });

    const callUdf = udfCall(functionName, argsText);
    const build = emission
        ? (value: string) => emitted(emission, value, {
            args, inputConfig, outputConfig, udf: callUdf, transform: false,
        })
        : callUdf;

    return {
        expression: nullUnlessValid(build, column, perElement(inputConfig, fullValues)),
        outputConfig,
        functionName,
        dispatch: emission ? 'sql+udf' : 'udf',
    };
}

/**
 * Wraps a validation predicate so a failing value becomes null and the row is kept, like
 * `validatorTransformFN` (`if (fn(value)) return value; return null`).
 *
 * The nulling is done in SQL so it is the same whether the predicate is a UDF call or native
 * SQL. For an array column checked per element, each failing element becomes null and the list
 * is kept, as in `DataFrame`: `contains('e')` over `['hello', 'sky']` gives `['hello', null]`,
 * and an empty list stays empty.
*/
function nullUnlessValid(
    predicate: (value: string) => string,
    column: string,
    elementWise: boolean
): string {
    if (elementWise) {
        return `list_transform(${column}, lambda x : CASE WHEN ${predicate('x')} THEN x ELSE NULL END)`;
    }
    return `CASE WHEN ${predicate(column)} THEN ${column} ELSE NULL END`;
}

/**
 * Applies a per-value expression to the column.
 *
 * For an array column under `INDIVIDUAL_VALUES`, `list_transform` maps over the elements, as
 * `dataFrameAdapter`'s `_mapValue` does. The per-value expression stays scalar, so neither the
 * UDF nor a `sql` definition needs its own array handling.
 *
 * `build` receives the value expression, so a UDF call and a native SQL expression are wrapped
 * the same way.
 */
function applyToValues(
    build: (value: string) => string,
    column: string,
    inputConfig: DataTypeFieldAndChildren,
    fullValues: boolean
): string {
    if (inputConfig.field_config.array && !fullValues) {
        // use `lambda x : ...`, not `x -> ...`: DuckDB v2.0 disables the single-arrow syntax
        // by default and v2.1 removes the `lambda_syntax` flag that re-enables it
        return `list_transform(${column}, lambda x : ${build('x')})`;
    }
    return build(column);
}

/**
 * Returns the function's `sql` definition if it applies to this column and arguments and the
 * caller has not turned it off.
 *
 * `types` limits the SQL to the accepted types it is correct for, since a function that accepts
 * both `String` and `Number` may have a native equivalent for only one. Without `types` it applies
 * wherever the function does (the caller has already checked `accepts`).
 *
 * The check uses `validateAccepts`, not `includes`, because type membership is by family:
 * `FieldType.String` also admits `Keyword`, `Text` and the rest, and `FieldType.Number` admits
 * every numeric width.
*/
function emissionFor<T extends Record<string, any>>(
    fnDef: FunctionDefinitionConfig<T>,
    inputConfig: DataTypeFieldAndChildren,
    preferSql: boolean | undefined,
    args: T
): SqlEmission<T> | undefined {
    if (preferSql === false || !fnDef.sql) return undefined;

    const { types, applies } = fnDef.sql;
    if (types?.length && typesError(types, inputConfig)) return undefined;
    // `applies` limits the SQL by argument, when it is only correct for some arguments
    if (applies && !applies(args, inputConfig)) return undefined;

    return fnDef.sql;
}

interface EmittedOptions<T extends Record<string, any>> {
    args: T;
    inputConfig: DataTypeFieldAndChildren;
    outputConfig: DataTypeFieldAndChildren;
    udf: (value: string) => string;
    /** A transform's result is the new value; a validation's is a predicate. */
    transform: boolean;
}

/**
 * Builds the SQL expression for one value from the function's `sql` definition.
 *
 * A `Date` is stored as `{ ms, tz_offset }` (see `date-value.ts`), while date SQL is written
 * against a TIMESTAMP. So `value` is the local wall time (the instant shifted by the row's
 * offset, which is what `DataFrame`'s date functions read from a `DateTuple`), and `instant` is
 * the unshifted instant for functions that ignore the offset. A transform's TIMESTAMP result is
 * turned back into a date value with no offset, as `DataFrame` returns plain millis.
 *
 * `udf` is called with the raw date value, because the UDF takes the stored date, not a
 * TIMESTAMP.
*/
function emitted<T extends Record<string, any>>(
    emission: SqlEmission<T>,
    raw: string,
    options: EmittedOptions<T>
): string {
    const {
        args, inputConfig, outputConfig, udf, transform,
    } = options;
    const date = isDate(inputConfig);
    const result = emission.expression({
        value: date ? localSQL(raw) : raw,
        instant: date ? instantSQL(raw) : undefined,
        args,
        inputConfig,
        outputConfig,
        udf: date ? () => udf(raw) : udf,
    });
    const timestamp = transform && isDate(outputConfig) && !emission.returns_date_value;
    return timestamp ? fromTimestampSQL(result) : result;
}

/**
 * The `udf` callback passed to a `sql` definition when no UDF was registered.
 *
 * It throws, because otherwise the SQL would reference a function that does not exist and fail
 * at query time, far from the cause. A `sql` definition that calls `udf` must set
 * `needs_udf_fallback`.
*/
function noUdf(name: string): (value: string) => string {
    return () => {
        throw new Error(
            `"${name}" has a sql expression that calls ctx.udf but does not set`
            + ' `needs_udf_fallback: true`, so no UDF was registered'
        );
    };
}

/** Validates args the same way `dataFrameAdapter` does, defaulting to an empty object. */
function resolveArgs<T extends Record<string, any>>(
    fnDef: FunctionDefinitionConfig<T>,
    args: T | undefined
): T {
    return validateFunctionArgs(fnDef, isNil(args) ? ({} as T) : args);
}

function acceptsError<T extends Record<string, any>>(
    fnDef: FunctionDefinitionConfig<T>,
    inputConfig: DataTypeFieldAndChildren
): Error | undefined {
    return typesError(fnDef.accepts, inputConfig);
}

/**
 * Runs `validateAccepts` against one column's config. Types match by family, so `Keyword`
 * satisfies `String`.
*/
function typesError(
    types: readonly FieldType[],
    inputConfig: DataTypeFieldAndChildren
): Error | undefined {
    return validateAccepts(
        types,
        getFieldTypesFromFieldConfigAndChildConfig(
            inputConfig.field_config as DataTypeFieldConfig,
            inputConfig.child_config
        )
    );
}

function isDate(config: DataTypeFieldAndChildren): boolean {
    return config.field_config.type === FieldType.Date;
}

/** The field config without `array`. */
function elementOf(config: DataTypeFieldAndChildren): DataTypeFieldConfig {
    const { array, ...rest } = config.field_config as DataTypeFieldConfig;
    return rest as DataTypeFieldConfig;
}

/**
 * Whether the function is applied to each element of an array column (`INDIVIDUAL_VALUES`), so
 * the UDF receives one element at a time. `applyToValues` wraps these in `list_transform`.
*/
function perElement(inputConfig: DataTypeFieldAndChildren, fullValues: boolean): boolean {
    return inputConfig.field_config.array === true && !fullValues;
}

/**
 * The UDF's parameter config: the element type when the function runs per element, otherwise the
 * whole column. For a `FULL_VALUES` function over an array column that is the whole list.
*/
function udfParameter(
    inputConfig: DataTypeFieldAndChildren,
    fullValues: boolean
): DataTypeFieldConfig {
    return perElement(inputConfig, fullValues)
        ? elementOf(inputConfig)
        : inputConfig.field_config as DataTypeFieldConfig;
}

/**
 * The UDF's result config: what one call returns.
 *
 * When the function runs per element, the result is `output_type` applied to the element. It is
 * not the column's output config with `array` removed, which would be wrong when the per-element
 * result is itself an array (`split` on a `Keyword[]`). Otherwise one call sees the whole value,
 * so the result is the column's output config.
*/
function udfResult<T extends Record<string, any>>(
    fnDef: FieldTransformConfig<T>,
    args: T,
    inputConfig: DataTypeFieldAndChildren,
    outputConfig: DataTypeFieldAndChildren,
    fullValues: boolean
): DataTypeFieldAndChildren {
    if (!perElement(inputConfig, fullValues)) return outputConfig;

    const element: DataTypeFieldAndChildren = {
        field_config: elementOf(inputConfig),
        child_config: inputConfig.child_config,
    };
    return fnDef.output_type ? fnDef.output_type(element, args) : element;
}

/**
 * Returns a UDF name unique to the function and its types, not its arguments or field.
 *
 * DuckDB cannot unregister a scalar function, so every registered name is permanent. Arguments
 * are passed as a parameter (`udfCall`) instead of being part of the name, so the number of
 * registrations is bounded by the functions and types in use.
 *
 * The types must be part of the name, because a registration declares its parameter and result
 * types: `isBoolean` over a `Boolean` column and over a `Keyword` column are different DuckDB
 * functions. The whole config is hashed, since `Number` and `Number[]`, or Objects with different
 * members, also differ.
 *
 * `specialisedArgs` is set only for arguments JSON cannot represent (see `argumentsText`); they
 * are then included in the name, which is not bounded.
*/
function udfName(name: string, types: readonly unknown[], specialisedArgs?: unknown): string {
    const specialised = specialisedArgs === undefined
        ? ''
        : inspect(specialisedArgs, { depth: null, sorted: true });
    return `dm_${name}_${hash(`${JSON.stringify(types)}|${specialised}`)}`.toLowerCase();
}

/**
 * Returns the validated arguments as the JSON text a UDF receives as its second parameter, or
 * undefined when JSON cannot represent them exactly (a non-finite number, a Date, a bigint).
 * GraphQL arguments are JSON, so in practice this always succeeds for them.
*/
function argumentsText(args: Record<string, unknown>): string | undefined {
    return isJSON(args) ? JSON.stringify(args) : undefined;
}

function isJSON(value: unknown): boolean {
    if (value == null || typeof value === 'string' || typeof value === 'boolean') return true;
    if (typeof value === 'number') return Number.isFinite(value);
    if (Array.isArray(value)) return value.every(isJSON);
    return Object.getPrototypeOf(value) === Object.prototype && Object.values(value).every(isJSON);
}

/** The UDF implementation: built per argument set when arguments are passed as JSON. */
function implementation<T>(
    args: T,
    argsText: string | undefined,
    implFor: (args: T) => ScalarFunctionImpl
): { fn: ScalarFunctionImpl } | { fnForArgs: (text: string) => ScalarFunctionImpl } {
    if (argsText === undefined) return { fn: implFor(args) };
    return { fnForArgs: (text) => implFor(JSON.parse(text) as T) };
}

/** Returns SQL that calls the UDF on `value`, with the arguments JSON as a second parameter. */
function udfCall(functionName: string, argsText: string | undefined): (value: string) => string {
    if (argsText === undefined) return (value) => `${functionName}(${value})`;
    const argsLiteral = quoteLiteral(argsText);
    return (value) => `${functionName}(${value}, ${argsLiteral})`;
}

/** A small, stable string hash; it only needs to avoid collisions between type signatures. */
function hash(input: string): string {
    let h = 5381;
    for (let i = 0; i < input.length; i++) {
        h = ((h * 33) ^ input.charCodeAt(i)) >>> 0;
    }
    return h.toString(36);
}

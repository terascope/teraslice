import { isNil } from '@terascope/core-utils';
import { DataTypeFieldConfig, FieldType } from '@terascope/types';
import { validateFunctionArgs } from '../argument-validator/index.js';
import { validateAccepts, getFieldTypesFromFieldConfigAndChildConfig } from '../../column/index.js';
import {
    FunctionDefinitionConfig, FieldTransformConfig, FieldValidateConfig,
    isFieldTransform, isFieldValidation, ProcessMode, DataTypeFieldAndChildren,
    SqlEmission,
} from '../../function-configs/interfaces.js';
import { quoteIdentifier } from '../../duck-frame/sql.js';
import { ScalarFunctionImpl } from '../../duck-frame/scalar-function.js';
import { registerScalarFunction } from '../../duck-frame/DuckFrame.js';

export interface DuckFrameAdapterOptions<T extends Record<string, any>> {
    /** The column the function applies to. */
    field: string;
    /** The column's CURRENT field config - what the plan says it is at this step. */
    inputConfig: DataTypeFieldAndChildren;
    /**
     * Function arguments, bound once at registration.
     *
     * The same choice `dataFrameAdapter` makes for its static-args path: a directive's args are
     * constants for the whole query, so `create()` is called once and the resulting closure is
     * the UDF body. **Per-row args are NOT supported** - the JS adapter handles those with
     * `args: (rowIndex) => ...`, which has no analogue here because a UDF's inputs are columns.
     * A row-dependent argument has to become an extra column, which the caller must arrange.
    */
    args?: T;
    /** Database to register on. Defaults to the process-wide one. */
    database?: string;
    /**
     * Use a function's `sql` emission when it declares one. Defaults to TRUE.
     *
     * **An off switch is a requirement, not a convenience.** The parity gate has to run the same
     * function both ways to compare them, the benches have to time both paths, and a bad emission
     * found in production has to be switchable off without shipping a new build.
    */
    preferSql?: boolean;
}

export interface DuckFrameAdapterResult {
    /**
     * The SQL expression that applies the function to the column. Drop it straight into
     * `select({ [name]: expression }, config)`.
    */
    expression: string;
    /**
     * The field config the column has AFTER this step - from the function's own `output_type`.
     * Thread it into the next step; this is how the plan tracks a field changing type.
    */
    outputConfig: DataTypeFieldAndChildren;
    /**
     * The registered UDF name, or undefined when no UDF was needed - `ProcessMode.NONE`, or a
     * `sql` emission that does not need a fallback.
    */
    functionName?: string;
    /**
     * How the expression computes the value: native SQL, SQL with a UDF fallback for the values
     * SQL cannot do, or the UDF for every value.
     *
     * Exposed because it is the thing worth asserting in a test and reporting in a benchmark - a
     * silently un-promoted function looks exactly like a promoted one from the outside.
    */
    dispatch: 'sql' | 'sql+udf' | 'udf' | 'none';
}

/**
 * Runs a `FunctionDefinitionConfig` against a DuckDB column - the DuckDB sibling of
 * `dataFrameAdapter`.
 *
 * The function configs ARE the definition of these behaviours: name, aliases, argument schema,
 * accepted types, the `output_type` that says what the field becomes, and the implementation.
 * They are also what spaces turns into GraphQL directives, so they are the public surface. This
 * adapter therefore reuses them rather than restating any of it, for exactly the reason
 * `fromRecords` reuses `coerceToType`: one implementation of each behaviour, so nothing can
 * drift.
 *
 * Every decision below mirrors `dataFrameAdapter` deliberately. If that changes, change this.
 */
export async function duckFrameAdapter<T extends Record<string, any> = Record<string, unknown>>(
    fnDef: FunctionDefinitionConfig<T>,
    options: DuckFrameAdapterOptions<T>
): Promise<DuckFrameAdapterResult> {
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
    options: DuckFrameAdapterOptions<T>
): Promise<DuckFrameAdapterResult> {
    const { field, inputConfig } = options;
    const args = resolveArgs(fnDef, options.args);

    // A transform THROWS on a type mismatch, where a validation clears the column.
    // That asymmetry is dataFrameAdapter's, not ours.
    const err = acceptsError(fnDef, inputConfig);
    if (err) throw err;

    const outputConfig = fnDef.output_type
        ? fnDef.output_type(inputConfig, args)
        : inputConfig;

    const column = quoteIdentifier(field);

    // ProcessMode.NONE is a metadata/type change only - the JS adapter copies the vector
    // unchanged (`copyVectorToBuilder`), so there is nothing to run in SQL either.
    if (fnDef.process_mode === ProcessMode.NONE) {
        return { expression: column, outputConfig, dispatch: 'none' };
    }

    const fullValues = fnDef.process_mode === ProcessMode.FULL_VALUES;
    const emission = emissionFor(fnDef, inputConfig, options.preferSql, args);

    // pure SQL: no UDF is registered at all, so the JS boundary - 178 ns per value, single
    // threaded - is not merely made cheaper, it is gone
    if (emission && !emission.needs_udf_fallback) {
        return {
            expression: applyToValues(
                (value) => emission.expression(emissionContext(
                    value, args, inputConfig, outputConfig, noUdf(fnDef.name)
                )),
                column,
                inputConfig,
                fullValues
            ),
            outputConfig,
            dispatch: 'sql',
        };
    }

    const impl = fnDef.create({
        args, inputConfig, outputConfig,
    } as any) as ScalarFunctionImpl;

    const functionName = await registerScalarFunction({
        name: udfName(fnDef.name, field, fieldTypeOf(inputConfig), args),
        parameter: fieldTypeOf(inputConfig),
        returns: scalarResultConfig(outputConfig),
        returnsChildren: outputConfig.child_config as any,
        fn: impl,
        callWithNull: fullValues,
        database: options.database,
    });

    const callUdf = (value: string) => `${functionName}(${value})`;
    const build = emission
        ? (value: string) => emission.expression(emissionContext(
            value, args, inputConfig, outputConfig, callUdf
        ))
        : callUdf;

    return {
        expression: applyToValues(build, column, inputConfig, fullValues),
        outputConfig,
        functionName,
        dispatch: emission ? 'sql+udf' : 'udf',
    };
}

async function adaptValidation<T extends Record<string, any>>(
    fnDef: FieldValidateConfig<T>,
    options: DuckFrameAdapterOptions<T>
): Promise<DuckFrameAdapterResult> {
    const { field, inputConfig } = options;
    const args = resolveArgs(fnDef, options.args);
    const column = quoteIdentifier(field);

    // A validation on a mismatched type CLEARS the column rather than throwing - see
    // `validateColumnData`, which returns `column.clearAll()`.
    if (acceptsError(fnDef, inputConfig)) {
        return { expression: 'NULL', outputConfig: inputConfig, dispatch: 'none' };
    }

    // A validation never changes the field type: the JS adapter builds the output with
    // `column.vector.config`, the input's own config.
    const outputConfig = inputConfig;

    const fullValues = fnDef.process_mode === ProcessMode.FULL_VALUES;
    const emission = emissionFor(fnDef, inputConfig, options.preferSql, args);

    /**
     * Failing validation NULLS the value and keeps the row - `validatorTransformFN`:
     * `if (fn(value)) return value; return null`. Expressed in SQL so the nulling is visible
     * rather than hidden inside a UDF, and identical on both dispatch paths - the emission
     * replaces only the PREDICATE, never the shape around it.
    */
    const nullUnless = (check: string) => `CASE WHEN ${check} THEN ${column} ELSE NULL END`;

    if (emission && !emission.needs_udf_fallback) {
        return {
            expression: nullUnless(applyToValues(
                (value) => emission.expression(emissionContext(
                    value, args, inputConfig, inputConfig, noUdf(fnDef.name)
                )),
                column,
                inputConfig,
                fullValues
            )),
            outputConfig,
            dispatch: 'sql',
        };
    }

    const predicate = fnDef.create({ args, inputConfig } as any) as ScalarFunctionImpl;

    const functionName = await registerScalarFunction({
        name: udfName(fnDef.name, field, fieldTypeOf(inputConfig), args),
        parameter: fieldTypeOf(inputConfig),
        returns: { type: FieldType.Boolean },
        fn: predicate,
        callWithNull: fullValues,
        database: options.database,
    });

    const callUdf = (value: string) => `${functionName}(${value})`;
    const build = emission
        ? (value: string) => emission.expression(emissionContext(
            value, args, inputConfig, inputConfig, callUdf
        ))
        : callUdf;

    return {
        expression: nullUnless(applyToValues(build, column, inputConfig, fullValues)),
        outputConfig,
        functionName,
        dispatch: emission ? 'sql+udf' : 'udf',
    };
}

/**
 * How a per-value expression is applied to the column.
 *
 * For an array column under `INDIVIDUAL_VALUES`, SQL does the element-wise mapping via
 * `list_transform` - which is what the JS adapter's `_mapValue` does when it maps over an
 * array and skips nil elements. That keeps the per-value expression scalar, so no DuckDB LIST
 * parameter type is needed and a `sql` emission needs no array handling of its own.
 *
 * `build` takes the value expression rather than being a fixed function call, which is what lets
 * a UDF call and a spliced SQL expression go through exactly the same wrapping.
 */
function applyToValues(
    build: (value: string) => string,
    column: string,
    inputConfig: DataTypeFieldAndChildren,
    fullValues: boolean
): string {
    if (inputConfig.field_config.array && !fullValues) {
        // `lambda x : ...`, not `x -> ...`: DuckDB v2.0 disables the single-arrow syntax by
        // default and v2.1 removes the `lambda_syntax` flag that would bring it back.
        return `list_transform(${column}, lambda x : ${build('x')})`;
    }
    return build(column);
}

/**
 * The function's SQL emission, if it has one that applies here and the caller wants it.
 *
 * `types` NARROWS an emission to the accepted types it is actually correct for, because a
 * function that accepts both `String` and `Number` may have a native equivalent for only one of
 * them. With no `types` the emission applies wherever the function does - the caller has already
 * checked `accepts`.
 *
 * **The narrowing check goes through `validateAccepts`, not a plain `includes`.** Membership is
 * not literal in this codebase: `accepts: [FieldType.String]` also admits `Keyword`, `Text` and
 * the rest of the string family, and `[FieldType.Number]` admits every numeric width. A
 * hand-rolled `includes` silently declined the emission for every `Keyword` column, which is
 * most columns - and it looked exactly like the descriptor not existing.
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
    // narrowing by ARGUMENT, for a native that exists only for some of them - see `applies`
    if (applies && !applies(args, inputConfig)) return undefined;

    return fnDef.sql;
}

function emissionContext<T extends Record<string, any>>(
    value: string,
    args: T,
    inputConfig: DataTypeFieldAndChildren,
    outputConfig: DataTypeFieldAndChildren,
    udf: (value: string) => string
) {
    return {
        value, args, inputConfig, outputConfig, udf
    };
}

/**
 * The `udf` an emission gets when no UDF was registered.
 *
 * It throws instead of returning something, because the alternative is SQL that references a
 * function that does not exist - a runtime binder error at query time, far from its cause. An
 * emission that calls `udf` must declare `needs_udf_fallback`.
*/
function noUdf(name: string): (value: string) => string {
    return () => {
        throw new Error(
            `"${name}" has a sql emission that calls ctx.udf but does not set`
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
 * `validateAccepts` against one column's config - family-aware, so `Keyword` satisfies
 * `String`.
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

function fieldTypeOf(config: DataTypeFieldAndChildren): FieldType {
    return config.field_config.type as FieldType;
}

/**
 * The UDF's result config.
 *
 * `array` is dropped: under `INDIVIDUAL_VALUES` the UDF is called per ELEMENT (SQL does the
 * mapping with `list_transform`), so its own result is a single value even when the column is
 * an array.
 */
function scalarResultConfig(config: DataTypeFieldAndChildren): DataTypeFieldConfig {
    const { array, ...rest } = config.field_config as DataTypeFieldConfig;
    return rest as DataTypeFieldConfig;
}

/**
 * A UDF name unique to this function, column type and argument set.
 *
 * The implementation is specialised by `create({ args, inputConfig })`, so two different arg
 * sets are two different functions and must not share a name. Registration is idempotent for
 * the same name, so the same (function, args, type) reuses one registration.
 *
 * **The COLUMN TYPE is part of the name, and leaving it out was a real collision.** A registration
 * declares one parameter type, so `isBoolean` over a `Boolean` column and `isBoolean` over a
 * `Keyword` column are two different DuckDB functions; sharing a name meant the first one
 * registered won and the second query failed to bind -
 * `No function matches ... 'dm_isboolean_hk1m0p(VARCHAR)'`. The field name alone hid this whenever
 * two frames used the same column name for different types.
 */
function udfName(
    name: string,
    field: string,
    type: FieldType,
    args: Record<string, unknown>
): string {
    const argPart = Object.keys(args).length ? JSON.stringify(args) : '';
    return `dm_${name}_${hash(`${name}|${field}|${type}|${argPart}`)}`.toLowerCase();
}

/** Small stable string hash - only needs to avoid collisions between arg sets. */
function hash(input: string): string {
    let h = 5381;
    for (let i = 0; i < input.length; i++) {
        h = ((h * 33) ^ input.charCodeAt(i)) >>> 0;
    }
    return h.toString(36);
}

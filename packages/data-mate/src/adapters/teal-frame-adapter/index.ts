import { isNil } from '@terascope/core-utils';
import { DataTypeFieldConfig, DataTypeFields, FieldType } from '@terascope/types';
import { validateFunctionArgs } from '../argument-validator/index.js';
import { validateAccepts, getFieldTypesFromFieldConfigAndChildConfig } from '../../column/index.js';
import {
    FunctionDefinitionConfig, FieldTransformConfig, FieldValidateConfig,
    isFieldTransform, isFieldValidation, ProcessMode, DataTypeFieldAndChildren,
    SqlEmission,
} from '../../function-configs/interfaces.js';
import { quoteIdentifier } from '@terascope/sql-builder';
import { ScalarFunctionImpl } from '../../teal-frame/scalar-function.js';
import { registerScalarFunction, makeBigIntInputNormaliser } from '../../teal-frame/index.js';
import { coerceToType } from '../../builder/type-coercion.js';

export interface TealFrameAdapterOptions<T extends Record<string, any>> {
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

export interface TealFrameAdapterResult {
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

    // A transform THROWS on a type mismatch, where a validation clears the column.
    // That asymmetry is dataFrameAdapter's, not ours.
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
    const resultConfig = udfResult(fnDef, args, inputConfig, outputConfig, fullValues);

    const functionName = await registerScalarFunction({
        name: udfName(fnDef.name, field, inputConfig, args),
        parameter: udfParameter(inputConfig, fullValues),
        parameterChildren: inputConfig.child_config,
        returns: resultConfig.field_config as DataTypeFieldConfig,
        returnsChildren: resultConfig.child_config,
        fn: coercingResult(impl, resultConfig),
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

/**
 * `ProcessMode.NONE` - `cast`, the only one - changes the field's CONFIG, and the values follow.
 *
 * The JS adapter runs it as `copyVectorToBuilder`, copying each value into a Builder for the NEW
 * config, and the Builder coerces: `cast` to Integer turns `'21.223'` into `21`, to an array wraps
 * it as `[21]`, and to an invalid IP throws. So where the shape changes this is a UDF over the
 * SAME `coerceToType` - one implementation of the semantics, as `fromRecords` does it. Returning
 * the column untouched left `'21.223'` in a column whose config said Integer.
 *
 * Where only metadata changes (`description`, `locale`...) the values are already right, so the
 * column is copied as before and no UDF is registered.
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
    const functionName = await registerScalarFunction({
        name: udfName(fnDef.name, field, inputConfig, args),
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
 * Coerces a value into a config exactly as a `DataFrame` Builder does - every Builder's
 * `_valueFrom` is `coerceToType(config)` - so a result that disagrees with its `output_type` is
 * converted, or throws, the same way: `setDefault`/`toJSON` on an Integer column give `"5"`, and
 * `ceil(1e21)` into an Integer throws. Without it DuckDB was handed the raw result and failed with
 * `A string was expected` (DF2, DF5, DF11).
 *
 * The bigint normaliser goes first for the reason it exists on ingest (DF15): `toBigIntOrThrow`
 * adds 1 to a value it PARSES past 2^53 and returns a bigint untouched, and the value converter
 * undoes the `+1` - so a bigint result has to be handed over as its decimal string to stay exact.
*/
function resultCoercion(config: DataTypeFieldAndChildren): (value: unknown) => unknown {
    const fieldConfig = config.field_config as DataTypeFieldConfig;
    const childConfig = config.child_config as DataTypeFields | undefined;
    const coerce = coerceToType(fieldConfig, childConfig);
    const normalise = makeBigIntInputNormaliser(fieldConfig, childConfig);

    return (value) => {
        if (value == null) return value;
        return coerce(normalise ? normalise(value) : value);
    };
}

function coercingResult(
    impl: ScalarFunctionImpl,
    config: DataTypeFieldAndChildren
): ScalarFunctionImpl {
    const coerce = resultCoercion(config);
    return (value, index) => coerce(impl(value, index));
}

/** What decides the stored values: type, array-ness and children, and nothing else. */
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

    if (emission && !emission.needs_udf_fallback) {
        return {
            expression: nullUnlessValid(
                (value) => emission.expression(emissionContext(
                    value, args, inputConfig, inputConfig, noUdf(fnDef.name)
                )),
                column,
                perElement(inputConfig, fullValues)
            ),
            outputConfig,
            dispatch: 'sql',
        };
    }

    const predicate = fnDef.create({ args, inputConfig } as any) as ScalarFunctionImpl;

    const functionName = await registerScalarFunction({
        name: udfName(fnDef.name, field, inputConfig, args),
        parameter: udfParameter(inputConfig, fullValues),
        parameterChildren: inputConfig.child_config,
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
        expression: nullUnlessValid(build, column, perElement(inputConfig, fullValues)),
        outputConfig,
        functionName,
        dispatch: emission ? 'sql+udf' : 'udf',
    };
}

/**
 * Failing validation NULLS the value and keeps the row - `validatorTransformFN`:
 * `if (fn(value)) return value; return null`. Expressed in SQL so the nulling is visible rather
 * than hidden inside a UDF, and identical on both dispatch paths - the emission replaces only the
 * PREDICATE, never the shape around it.
 *
 * Where SQL maps over a list, the nulling is per ELEMENT and the list is kept, as `DataFrame`
 * does it: `contains('e')` over `['hello', 'sky']` is `['hello', null]`, an empty list stays empty.
 * Wrapping the mapped predicate - a `BOOLEAN[]` - in one `CASE WHEN` was DF1, `Unimplemented type
 * for cast (BOOLEAN[] -> BOOLEAN)` on every validation of an array field.
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

/** The field config without `array`. */
function elementOf(config: DataTypeFieldAndChildren): DataTypeFieldConfig {
    const { array, ...rest } = config.field_config as DataTypeFieldConfig;
    return rest as DataTypeFieldConfig;
}

/**
 * Whether SQL maps the function over the column's elements, so the UDF sees ONE element at a
 * time - an array column under `INDIVIDUAL_VALUES`, which `applyToValues` wraps in
 * `list_transform`.
*/
function perElement(inputConfig: DataTypeFieldAndChildren, fullValues: boolean): boolean {
    return inputConfig.field_config.array === true && !fullValues;
}

/**
 * The UDF's parameter config: the element when SQL maps over the list, otherwise the whole
 * column - which for a `FULL_VALUES` function over an array column is the LIST it folds.
 * Registering the element type there was DF4: `dm_addvalues(DOUBLE)` for a `DOUBLE[]` column.
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
 * The UDF's result config: what ONE call returns.
 *
 * Where SQL maps over the list, one call sees one element, so the result is the function's own
 * `output_type` applied to the ELEMENT - not the column's output with `array` dropped, which is
 * wrong for any function whose per-element result is itself an array (`split` on a `Keyword[]`).
 * Everywhere else one call sees the whole value, so its result is the column's output. Dropping
 * `array` unconditionally was DF4: `split` promised VARCHAR and returned a list.
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
 * two frames used the same column name for different types. The WHOLE config is hashed, not just
 * the type, because `Number` and `Number[]`, or two Objects with different members, are different
 * parameter types too.
 */
function udfName(
    name: string,
    field: string,
    inputConfig: DataTypeFieldAndChildren,
    args: Record<string, unknown>
): string {
    const argPart = Object.keys(args).length ? JSON.stringify(args) : '';
    const typePart = JSON.stringify([inputConfig.field_config, inputConfig.child_config ?? null]);
    return `dm_${name}_${hash(`${name}|${field}|${typePart}|${argPart}`)}`.toLowerCase();
}

/** Small stable string hash - only needs to avoid collisions between arg sets. */
function hash(input: string): string {
    let h = 5381;
    for (let i = 0; i < input.length; i++) {
        h = ((h * 33) ^ input.charCodeAt(i)) >>> 0;
    }
    return h.toString(36);
}

import { isNil } from '@terascope/core-utils';
import { DataTypeFieldConfig, FieldType } from '@terascope/types';
import { validateFunctionArgs } from '../argument-validator/index.js';
import { validateAccepts, getFieldTypesFromFieldConfigAndChildConfig } from '../../column/index.js';
import {
    FunctionDefinitionConfig, FieldTransformConfig, FieldValidateConfig,
    isFieldTransform, isFieldValidation, ProcessMode, DataTypeFieldAndChildren,
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
    /** The registered UDF name, or undefined when no UDF was needed (`ProcessMode.NONE`). */
    functionName?: string;
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
        return { expression: column, outputConfig };
    }

    const impl = fnDef.create({
        args, inputConfig, outputConfig,
    } as any) as ScalarFunctionImpl;

    const fullValues = fnDef.process_mode === ProcessMode.FULL_VALUES;

    const functionName = await registerScalarFunction({
        name: udfName(fnDef.name, field, args),
        parameter: fieldTypeOf(inputConfig),
        returns: scalarResultConfig(outputConfig),
        returnsChildren: outputConfig.child_config as any,
        fn: impl,
        callWithNull: fullValues,
        database: options.database,
    });

    return {
        expression: applyExpression(functionName, column, inputConfig, fullValues),
        outputConfig,
        functionName,
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
        return { expression: 'NULL', outputConfig: inputConfig };
    }

    // A validation never changes the field type: the JS adapter builds the output with
    // `column.vector.config`, the input's own config.
    const outputConfig = inputConfig;

    const predicate = fnDef.create({ args, inputConfig } as any) as ScalarFunctionImpl;
    const fullValues = fnDef.process_mode === ProcessMode.FULL_VALUES;

    const functionName = await registerScalarFunction({
        name: udfName(fnDef.name, field, args),
        parameter: fieldTypeOf(inputConfig),
        returns: { type: FieldType.Boolean },
        fn: predicate,
        callWithNull: fullValues,
        database: options.database,
    });

    // Failing validation NULLS the value and keeps the row - `validatorTransformFN`:
    // `if (fn(value)) return value; return null`. Expressed in SQL so the nulling is visible
    // rather than hidden inside a UDF.
    const check = applyExpression(functionName, column, inputConfig, fullValues);
    return {
        expression: `CASE WHEN ${check} THEN ${column} ELSE NULL END`,
        outputConfig,
        functionName,
    };
}

/**
 * How the UDF is applied to the column.
 *
 * For an array column under `INDIVIDUAL_VALUES`, SQL does the element-wise mapping via
 * `list_transform` - which is what the JS adapter's `_mapValue` does when it maps over an
 * array and skips nil elements. That keeps the UDF itself scalar, so no DuckDB LIST parameter
 * type is needed.
 */
function applyExpression(
    functionName: string,
    column: string,
    inputConfig: DataTypeFieldAndChildren,
    fullValues: boolean
): string {
    if (inputConfig.field_config.array && !fullValues) {
        return `list_transform(${column}, x -> ${functionName}(x))`;
    }
    return `${functionName}(${column})`;
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
    return validateAccepts(
        fnDef.accepts,
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
 */
function udfName(name: string, field: string, args: Record<string, unknown>): string {
    const argPart = Object.keys(args).length ? JSON.stringify(args) : '';
    return `dm_${name}_${hash(`${name}|${field}|${argPart}`)}`.toLowerCase();
}

/** Small stable string hash - only needs to avoid collisions between arg sets. */
function hash(input: string): string {
    let h = 5381;
    for (let i = 0; i < input.length; i++) {
        h = ((h * 33) ^ input.charCodeAt(i)) >>> 0;
    }
    return h.toString(36);
}

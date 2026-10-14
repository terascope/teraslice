import { DuckDBScalarFunction, VARCHAR } from '@duckdb/node-api';
import {
    FieldType, DataTypeFieldConfig, DataTypeFields, ReadonlyDataTypeFields
} from '@terascope/types';
import { makeValueConverter } from './duck-values.js';
import { makeInputConverter, udfTypeFor } from './udf-types.js';

/**
 * A per-value implementation, matching what `FieldTransformConfig.create` /
 * `FieldValidateConfig.create` return: `(value, index) => result`.
 */
export type ScalarFunctionImpl = (value: unknown, index: number) => unknown;

export interface ScalarFunctionSpec {
    /** The name it is called by in SQL. */
    name: string;
    /**
     * The single value argument: a bare field type, or a full field config for a list, struct or
     * JSON value, which a bare type cannot express. See `udfTypeFor`.
    */
    parameter: FieldType | DataTypeFieldConfig;
    /** Children of the parameter, for an Object/Tuple parameter. */
    parameterChildren?: DataTypeFields | ReadonlyDataTypeFields;
    /**
     * The result's field config, not just its type.
     *
     * The returned JS value must be converted to DuckDB's representation (a BIGINT vector
     * rejects a `number`, for example). `makeValueConverter`, which `fromRecords` also uses,
     * does that from the config.
     */
    returns: DataTypeFieldConfig;
    /** Children of the result type, for Object/Tuple results. */
    returnsChildren?: DataTypeFields | ReadonlyDataTypeFields;
    /**
     * The implementation, called once per row.
     *
     * This should come from a function config's `create()` via `tealFrameAdapter`, not be
     * written by hand. The function configs already define the name, arguments, accepted types,
     * `output_type`, and null and array handling, so restating them here would duplicate them.
     *
     * Exactly one of `fn` and `fnForArgs` is set.
     */
    fn?: ScalarFunctionImpl;
    /**
     * Builds the implementation for one argument set from its JSON text, which the SQL passes as
     * a second, constant parameter: `dm_lookup_x(code, '{"in":{...}}')`.
     *
     * This keeps the number of registered UDFs bounded. DuckDB cannot unregister a scalar
     * function, so registering one UDF per argument set (per `lookup` table, regex or format)
     * would grow without limit in a long-running process. Passing the arguments as a parameter
     * means one UDF per function and type signature, and each argument set's implementation is
     * cached in a bounded LRU (`ARGUMENT_SETS_KEPT`).
    */
    fnForArgs?: (argsText: string) => ScalarFunctionImpl;
    /**
     * Call `fn` for rows where the argument is null. Defaults to false, which matches
     * `DataFrame`: `transformVectorToBuilder` iterates `vector.values()`, which skips nil
     * entries, so a transform never receives a null. DuckDB passes nulls to a UDF, so the skip
     * is done here.
     */
    callWithNull?: boolean;
}

/** How many argument sets' implementations one UDF keeps; the least recently used is dropped. */
export const ARGUMENT_SETS_KEPT = 256;

/** Memoizes `build` per argument text in a bounded LRU. */
function perArgumentSet(
    build: (argsText: string) => ScalarFunctionImpl
): (argsText: string) => ScalarFunctionImpl {
    const kept = new Map<string, ScalarFunctionImpl>();
    return (argsText) => {
        const found = kept.get(argsText);
        if (found) {
            kept.delete(argsText);
            kept.set(argsText, found);
            return found;
        }
        const built = build(argsText);
        kept.set(argsText, built);
        if (kept.size > ARGUMENT_SETS_KEPT) kept.delete(kept.keys().next().value as string);
        return built;
    };
}

/**
 * Wraps a per-row JS function as a vectorized DuckDB scalar function.
 *
 * The binding is chunk-based (`mainFunction(info, chunk, outputVector)`), so the JS boundary is
 * crossed once per chunk of about 2048 rows, not once per row.
 */
export function createScalarFunction(spec: ScalarFunctionSpec): DuckDBScalarFunction {
    const callWithNull = spec.callWithNull ?? false;
    // a computed result may be wider than a stored Long; see `wideIntegers`
    const convert = makeValueConverter(spec.returns, spec.returnsChildren, { wideIntegers: true });
    const parameter: DataTypeFieldConfig = typeof spec.parameter === 'string'
        ? { type: spec.parameter }
        : spec.parameter;
    /**
     * Input values need converting too. Without it, a date arrives as a DuckDB value class
     * that the date functions would misread (for example, as host-local time). See
     * `makeInputConverter`.
    */
    const toInput = makeInputConverter(parameter, spec.parameterChildren);
    const forArgs = spec.fnForArgs ? perArgumentSet(spec.fnForArgs) : undefined;
    if (!forArgs && !spec.fn) {
        throw new TypeError(`Scalar function "${spec.name}" needs \`fn\` or \`fnForArgs\``);
    }

    return DuckDBScalarFunction.create({
        name: spec.name,
        parameterTypes: forArgs
            ? [udfTypeFor(parameter, spec.parameterChildren), VARCHAR]
            : [udfTypeFor(parameter, spec.parameterChildren)],
        returnType: udfTypeFor(spec.returns, spec.returnsChildren, { wide: true }),
        mainFunction: (_info, chunk, output) => {
            const values = chunk.getColumnValues(0) as unknown[];
            /**
             * The arguments are one constant literal per call (`udfCall`), so only the first row
             * is read. Reading the whole column would copy the JSON into a JS string for every
             * row, which is very slow for a large `lookup` table.
            */
            const impl = forArgs
                ? forArgs(chunk.getColumnVector(1).getItem(0) as string)
                : spec.fn!;

            for (let row = 0; row < chunk.rowCount; row++) {
                const value = values[row];

                if (value == null && !callWithNull) {
                    output.setItem(row, null);
                    continue;
                }

                const result = impl(toInput(value), row);
                output.setItem(row, (result == null ? null : convert(result)) as any);
            }

            output.flush();
        },
    });
}

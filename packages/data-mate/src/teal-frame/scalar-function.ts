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
     * The single value argument: a bare field type, or the full field config when it is a list,
     * a struct or JSON - which a bare type cannot express. See `udfTypeFor`.
    */
    parameter: FieldType | DataTypeFieldConfig;
    /** Children of the parameter, for an Object/Tuple parameter. */
    parameterChildren?: DataTypeFields | ReadonlyDataTypeFields;
    /**
     * The result's FIELD CONFIG, not just its type.
     *
     * The config is needed because the JS value the function returns still has to be turned
     * into DuckDB's representation - a `number` is not accepted by a BIGINT vector, which
     * fails as `Cannot convert 1 to a BigInt`. That conversion is `makeValueConverter`, the
     * same one `fromRecords` uses, so there is one implementation of it.
     */
    returns: DataTypeFieldConfig;
    /** Children of the result type, for Object/Tuple results. */
    returnsChildren?: DataTypeFields | ReadonlyDataTypeFields;
    /**
     * The implementation, called once per row.
     *
     * **This should come from a function config's `create()` via `tealFrameAdapter`, not be
     * hand-written.** The function configs already define these behaviours - name, args,
     * accepted types, `output_type`, null and array handling - and are what spaces exposes as
     * GraphQL directives. Restating any of that here would be a second source of truth.
     *
     * Exactly one of `fn` and `fnForArgs` is set.
     */
    fn?: ScalarFunctionImpl;
    /**
     * **The implementation for an argument set**, built from that set's JSON text, which the SQL
     * passes as a SECOND, constant parameter: `dm_lookup_x(code, '{"in":{...}}')`.
     *
     * **This is what keeps registrations bounded.** DuckDB cannot unregister a scalar function, so
     * a UDF specialised to one argument set - named by it - is permanent, and a long-running worker
     * that sees a new `lookup` table, regex or format per query grows without bound: measured, 300
     * tables made 300 registrations. With the arguments as a parameter there is one UDF per
     * (function, types), and each argument set's implementation lives in a bounded LRU
     * (`ARGUMENT_SETS_KEPT`), so an old one can be collected.
    */
    fnForArgs?: (argsText: string) => ScalarFunctionImpl;
    /**
     * Call `fn` for rows where an argument is null. Defaults to **false**, which matches
     * data-mate: `transformVectorToBuilder` iterates `vector.values()`, and `ReadableData`
     * only yields NON-NIL entries, so a transform never receives a null. DuckDB does the
     * opposite - MEASURED, it hands nulls straight to the function - so the null skip has to
     * be reproduced here or behaviour diverges on every nullable column.
     */
    callWithNull?: boolean;
}

/** How many argument sets' implementations one UDF keeps; the least recently used is dropped. */
export const ARGUMENT_SETS_KEPT = 256;

/** `build`, memoised per argument text in a bounded LRU. */
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
 * The binding is chunk-based - `mainFunction(info, chunk, outputVector)` - so the JS boundary
 * is crossed once per chunk (~2048 rows), not once per row. Measured at ~4.5x a trivial
 * native expression, which is cheap enough that using the real primitive is the right trade.
 */
export function createScalarFunction(spec: ScalarFunctionSpec): DuckDBScalarFunction {
    const callWithNull = spec.callWithNull ?? false;
    // a result is COMPUTED, so it may be wider than a stored Long - see `wideIntegers`
    const convert = makeValueConverter(spec.returns, spec.returnsChildren, { wideIntegers: true });
    const parameter: DataTypeFieldConfig = typeof spec.parameter === 'string'
        ? { type: spec.parameter }
        : spec.parameter;
    /**
     * The way IN needs a conversion too, and its absence was a real defect: a `Date` arrived as a
     * `DuckDBTimestampValue` that the date primitives stringified into a zone-less string and
     * re-parsed as machine-local, drifting every date function by the host's UTC offset. See
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
             * The arguments are ONE literal per call (`udfCall`), the same on every row, so only
             * the first is read. Reading the column would copy the JSON into a JS string PER ROW:
             * measured, a 138 KB `lookup` table took 1M rows from 441 ms to 37 s.
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

import {
    DuckDBScalarFunction, DuckDBType,
    BOOLEAN, TINYINT, SMALLINT, BIGINT, HUGEINT, DOUBLE, VARCHAR, TIMESTAMP,
} from '@duckdb/node-api';
import { FieldType, DataTypeFieldConfig, DataTypeFields } from '@terascope/types';
import { makeValueConverter, makeInputConverter } from './duck-values.js';

/**
 * The `DuckDBType` OBJECT for each field type, for registering a scalar function.
 *
 * Deliberately separate from `DataType.toDuckDB()`, which yields type *strings* for DDL:
 * registration needs the binding's type objects, and `@terascope/data-types` neither depends
 * on `@duckdb/node-api` nor should - it is a pure types package. So the string mapping is the
 * shared, portable one and this is the binding-specific companion. **They must agree**; a
 * mismatch shows up as a wrong column type, which is what `diffSchema` exists to catch.
 */
const PARAMETER_TYPES: Partial<Record<FieldType, DuckDBType>> = {
    [FieldType.Boolean]: BOOLEAN,
    [FieldType.Byte]: TINYINT,
    [FieldType.Short]: SMALLINT,
    [FieldType.Integer]: BIGINT,
    [FieldType.Long]: HUGEINT,
    [FieldType.Float]: DOUBLE,
    [FieldType.Double]: DOUBLE,
    [FieldType.Number]: DOUBLE,
    [FieldType.Vector]: DOUBLE,
    [FieldType.Keyword]: VARCHAR,
    [FieldType.KeywordCaseInsensitive]: VARCHAR,
    [FieldType.KeywordTokens]: VARCHAR,
    [FieldType.KeywordTokensCaseInsensitive]: VARCHAR,
    [FieldType.KeywordPathAnalyzer]: VARCHAR,
    [FieldType.NgramTokens]: VARCHAR,
    [FieldType.Text]: VARCHAR,
    [FieldType.String]: VARCHAR,
    [FieldType.Domain]: VARCHAR,
    [FieldType.Hostname]: VARCHAR,
    [FieldType.IP]: VARCHAR,
    [FieldType.IPRange]: VARCHAR,
    [FieldType.Binary]: VARCHAR,
    [FieldType.Date]: TIMESTAMP,

    // NOT mapped, on purpose:
    // - GeoJSON / Any are JSON, and the binding exports no JSON type constant.
    // - GeoPoint / Geo / Boundary / Object / Tuple are STRUCTs, which need a type built at
    //   runtime rather than a constant.
    // duckDBTypeObject throws for these, which is better than silently accepting VARCHAR and
    // producing a column whose type contradicts the DataType config.
};

/** The DuckDB type object for a field type, or a clear error naming the gap. */
export function duckDBTypeObject(type: FieldType): DuckDBType {
    const mapped = PARAMETER_TYPES[type];
    if (mapped == null) {
        throw new TypeError(
            `Field type "${type}" cannot be a scalar function parameter or result yet`
            + ' - it has no DuckDB type object mapping'
        );
    }
    return mapped;
}

/**
 * A per-value implementation, matching what `FieldTransformConfig.create` /
 * `FieldValidateConfig.create` return: `(value, index) => result`.
 */
export type ScalarFunctionImpl = (value: unknown, index: number) => unknown;

export interface ScalarFunctionSpec {
    /** The name it is called by in SQL. */
    name: string;
    /** Field type of the single value argument. */
    parameter: FieldType;
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
    returnsChildren?: DataTypeFields;
    /**
     * The implementation, called once per row.
     *
     * **This should come from a function config's `create()` via `duckFrameAdapter`, not be
     * hand-written.** The function configs already define these behaviours - name, args,
     * accepted types, `output_type`, null and array handling - and are what spaces exposes as
     * GraphQL directives. Restating any of that here would be a second source of truth.
     */
    fn: ScalarFunctionImpl;
    /**
     * Call `fn` for rows where an argument is null. Defaults to **false**, which matches
     * data-mate: `transformVectorToBuilder` iterates `vector.values()`, and `ReadableData`
     * only yields NON-NIL entries, so a transform never receives a null. DuckDB does the
     * opposite - MEASURED, it hands nulls straight to the function - so the null skip has to
     * be reproduced here or behaviour diverges on every nullable column.
     */
    callWithNull?: boolean;
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
    const convert = makeValueConverter(spec.returns, spec.returnsChildren);
    /**
     * The way IN needs a conversion too, and its absence was a real defect: a `Date` arrived as a
     * `DuckDBTimestampValue` that the date primitives stringified into a zone-less string and
     * re-parsed as machine-local, drifting every date function by the host's UTC offset. See
     * `makeInputConverter`.
    */
    const toInput = makeInputConverter(spec.parameter);

    return DuckDBScalarFunction.create({
        name: spec.name,
        parameterTypes: [duckDBTypeObject(spec.parameter)],
        returnType: duckDBTypeObject(spec.returns.type as FieldType),
        mainFunction: (_info, chunk, output) => {
            const values = chunk.getColumnValues(0) as unknown[];

            for (let row = 0; row < chunk.rowCount; row++) {
                const value = values[row];

                if (value == null && !callWithNull) {
                    output.setItem(row, null);
                    continue;
                }

                const result = spec.fn(toInput(value), row);
                output.setItem(row, (result == null ? null : convert(result)) as any);
            }

            output.flush();
        },
    });
}

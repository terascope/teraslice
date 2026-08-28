import { DataTypeFieldConfig, xLuceneTypeConfig } from '@terascope/types';
import BaseType, { quoteDuckDBIdentifier } from './base-type.js';
import { GraphQLType, TypeESMapping, DuckDBTypeConfig } from '../interfaces.js';

/**
 * An ordered, fixed set of values where each position (element) has its own
 * type — the data-types analogue of a tuple. Declare the parent field as
 * `Tuple` and give each element a dot-notation, zero-based index name
 * (`field.0`, `field.1`, …), the same way {@link GroupType} object children
 * are declared. At least one element field is required (the builder throws
 * `Tuple field types require at least one field` otherwise).
 *
 * Unlike the v1 field types, this is not version-specific: it lives in
 * `src/types/` (not `src/types/v1/`) and is selected during field grouping
 * (`getTupleType`) rather than through the version registry. The `Tuple` entry
 * in `types/mapping.ts` points at {@link AnyType} but is never reached.
 *
 * - **ES/OpenSearch mapping:** `{ enabled: false }` on the parent field — the
 *   tuple is kept in `_source` but not indexed, and the element sub-fields are
 *   **not** emitted as individual mappings, so a tuple cannot be searched,
 *   sorted, or aggregated on.
 * - **GraphQL:** `JSON`. As with {@link AnyType}, no `scalar JSON` definition
 *   is emitted, so the surrounding schema must provide a `JSON` scalar — via
 *   a GraphQL patch or a scalar library — for the field to resolve.
 * - **xLucene:** the merged xLucene configs of the element types, keyed by
 *   their dot paths (e.g. `{ 'field.0': 'float', 'field.1': 'float' }`). The
 *   parent tuple field itself contributes no xLucene entry.
 *
 * @example
 * const config: DataTypeConfig = {
 *     version: 1,
 *     fields: {
 *         location: { type: 'Tuple' },
 *         'location.0': { type: 'Float' },
 *         'location.1': { type: 'Float' },
 *     }
 * };
 */
export default class TupleType extends BaseType {
    readonly types: readonly BaseType[];

    constructor(
        field: string,
        version: number,
        baseConfig: DataTypeFieldConfig,
        types: BaseType[]
    ) {
        super(field, baseConfig, version);
        this.types = types.slice();
    }

    toESMapping(): TypeESMapping {
        return {
            mapping: { [this.field]: { enabled: false } }
        };
    }

    toGraphQL(): GraphQLType {
        return this._formatGql('JSON');
    }

    toXlucene(): xLuceneTypeConfig {
        const configs = this.types.map((type) => type.toXlucene());
        return Object.assign({}, ...configs);
    }

    /**
     * Emit the tuple as a `STRUCT` whose child names are the positional indexes, so
     * `location.0` / `location.1` become `STRUCT("0" DOUBLE, "1" DOUBLE)`. The positions
     * need quoting because a bare `0` is not a valid identifier.
     */
    toDuckDB(): DuckDBTypeConfig {
        const children = this.types.map((type) => {
            const name = type.field.replace(`${this.field}.`, '').trim();
            return `${quoteDuckDBIdentifier(name)} ${type.toDuckDB()[type.field]}`;
        });

        if (!children.length) return this._formatDuckDB('JSON');
        return this._formatDuckDB(`STRUCT(${children.join(', ')})`);
    }
}

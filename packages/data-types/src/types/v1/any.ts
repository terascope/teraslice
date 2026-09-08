import { xLuceneTypeConfig, AnyFieldMapping } from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

/**
 * A field of unrestricted shape. The value is stored but excluded from
 * indexing, so it can hold arbitrary JSON without imposing a mapping.
 *
 * The type registry (`types/mapping.ts`) also maps `Tuple` to this class, but
 * that entry is a never-reached fallback — `Tuple` fields are intercepted
 * during field grouping and handled by their own {@link TupleType} class, so
 * `Any` does not actually back `Tuple` at runtime.
 *
 * - **ES/OpenSearch mapping:** `{ enabled: false }` — ES stores the value in
 *   `_source` but does not index it, so it cannot be searched, sorted, or
 *   aggregated on.
 * - **GraphQL:** `JSON`. Unlike `Object`/`GeoJSON` (which emit their own
 *   `scalar JSONObject`/`scalar GeoJSON` definitions), this type does not emit
 *   a `scalar JSON` definition, so the surrounding schema must provide a `JSON`
 *   scalar — via a GraphQL patch or a scalar library — for the field to
 *   resolve.
 * - **xLucene:** none — `toXlucene()` returns `{}`, so the field contributes
 *   no xLucene type.
 *
 * @example
 * const config: DataTypeConfig = {
 *     version: 1,
 *     fields: { payload: { type: 'Any' } }
 * };
 */
export default class AnyType extends BaseType {
    toESMapping(): TypeESMapping {
        this._validateESMapping();

        const config: AnyFieldMapping = { enabled: false };

        return {
            mapping: { [this.field]: config }
        };
    }

    toGraphQL(): GraphQLType {
        return this._formatGql('JSON');
    }

    toXlucene(): xLuceneTypeConfig {
        return {};
    }
}

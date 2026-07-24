import { xLuceneTypeConfig, AnyFieldMapping } from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

/**
 * A field of unrestricted shape. The value is stored but excluded from
 * indexing, so it can hold arbitrary JSON without imposing a mapping.
 *
 * This class also backs the `Tuple` field type (both `Any` and `Tuple` map to
 * it in the type registry).
 *
 * - **ES/OpenSearch mapping:** `{ enabled: false }` — ES stores the value in
 *   `_source` but does not index it, so it cannot be searched, sorted, or
 *   aggregated on.
 * - **GraphQL:** a `JSON` scalar (assumed to be defined elsewhere — unlike
 *   `Object`/`GeoJSON`, no `scalar` definition is emitted here).
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

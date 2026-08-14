import {
    xLuceneFieldType, ESFieldType, xLuceneTypeConfig,
    ESTypeMapping
} from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping, DuckDBTypeConfig } from '../../interfaces.js';

/**
 * A general-purpose numeric field for when the exact numeric width is not
 * important. Stored as an Elasticsearch/OpenSearch `double`.
 *
 * - **ES/OpenSearch mapping:** `{ type: 'double' }`. Honors `indexed: false`
 *   (emitted as `index: false`).
 * - **GraphQL:** `Float`. Because the value is a `double`, integers above
 *   2^53 may lose precision when round-tripped through GraphQL.
 * - **xLucene:** `Number` (a distribution-agnostic numeric type, unlike the
 *   more specific `Integer`/`Float` used by the fixed-width numeric types).
 *
 * Prefer a specific numeric type (`Integer`, `Long`, `Float`, `Double`) when
 * you know the width and want a tighter ES mapping.
 *
 * @example
 * const config: DataTypeConfig = {
 *     version: 1,
 *     fields: { score: { type: 'Number' } }
 * };
 */
export default class NumberClass extends BaseType {
    toESMapping(): TypeESMapping {
        this._validateESMapping();

        const config: ESTypeMapping = { type: 'double' as ESFieldType };

        if (this.config.indexed === false) config.index = false;

        return {
            mapping: {
                [this.field]: config
            }
        };
    }

    toGraphQL(): GraphQLType {
        return this._formatGql('Float');
    }

    toXlucene(): xLuceneTypeConfig {
        return { [this.field]: xLuceneFieldType.Number };
    }

    /**
     * The DuckDB column type for this field.
     */
    toDuckDB(): DuckDBTypeConfig {
        return this._formatDuckDB('DOUBLE');
    }
}

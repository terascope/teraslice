import {
    xLuceneFieldType, ESFieldType, xLuceneTypeConfig,
    ESTypeMapping
} from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping, DuckDBTypeConfig } from '../../interfaces.js';

/**
 * A whole number stored as an Elasticsearch/OpenSearch `long`
 * (64-bit signed integer).
 *
 * - **ES/OpenSearch mapping:** `{ type: 'long' }`. Honors `indexed: false`
 *   (emitted as `index: false`).
 * - **GraphQL:** `Float`, **not** `Int`. The GraphQL `Int` scalar is only
 *   32-bit, so it cannot represent the full `long` range; `Float` is used to
 *   avoid overflow. Note that IEEE-754 doubles lose integer precision above
 *   2^53, so very large `long` values may not round-trip exactly through
 *   GraphQL.
 * - **xLucene:** `Integer`.
 *
 * @example
 * const config: DataTypeConfig = {
 *     version: 1,
 *     fields: { bytes_transferred: { type: 'Long' } }
 * };
 */
export default class Long extends BaseType {
    toESMapping(): TypeESMapping {
        this._validateESMapping();

        const config: ESTypeMapping = { type: 'long' as ESFieldType };

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
        return { [this.field]: xLuceneFieldType.Integer };
    }

    /**
     * The DuckDB column type for this field: BIGINT, a signed 64-bit integer - exactly an
     * Elasticsearch `long`, which is where a stored Long comes from.
     *
     * **Not HUGEINT, which this was, and which corrupted data.** Parquet has no 128-bit
     * integer, so DuckDB writes a HUGEINT column as a DOUBLE: every value past 2^53 changed
     * on the wire between the producer and the worker, and `9223372036854775807` came back as
     * a value that no longer fits in 64 bits. BIGINT is INT64 in Parquet, exact at every value.
     *
     * A value outside the 64-bit range is rejected at ingest rather than stored wrong. A Long
     * COMPUTED in a query - `ipToInt` on an IPv6 address is 128 bits - keeps a wider SQL type
     * inside that query; it is not stored data.
     */
    toDuckDB(): DuckDBTypeConfig {
        return this._formatDuckDB('BIGINT');
    }
}

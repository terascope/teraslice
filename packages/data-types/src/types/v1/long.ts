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
     * The DuckDB column type for this field: BIGINT, a signed 64-bit integer, the same
     * range as an Elasticsearch `long`.
     *
     * Not HUGEINT: Parquet has no 128-bit integer, so DuckDB writes HUGEINT as a DOUBLE and
     * loses precision past 2^53. BIGINT is written as INT64 and stays exact.
     *
     * A value outside the 64-bit range is rejected at ingest. A Long computed inside a query
     * (for example `ipToInt` on an IPv6 address, which is 128 bits) can still use a wider
     * SQL type, because it is never stored.
     */
    toDuckDB(): DuckDBTypeConfig {
        return this._formatDuckDB('BIGINT');
    }
}

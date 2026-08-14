import {
    xLuceneFieldType, ESFieldType, xLuceneTypeConfig,
    ESTypeMapping
} from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping, DuckDBTypeConfig } from '../../interfaces.js';

/**
 * A floating-point number stored as an Elasticsearch/OpenSearch `double`
 * (64-bit, double-precision IEEE 754).
 *
 * - **ES/OpenSearch mapping:** `{ type: 'double' }`. Honors `indexed: false`
 *   (emitted as `index: false`).
 * - **GraphQL:** `Float`.
 * - **xLucene:** `Float`.
 *
 * @example
 * const config: DataTypeConfig = {
 *     version: 1,
 *     fields: { latitude_precise: { type: 'Double' } }
 * };
 */
export default class Double extends BaseType {
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
        return { [this.field]: xLuceneFieldType.Float };
    }

    /**
     * The DuckDB column type for this field.
     */
    toDuckDB(): DuckDBTypeConfig {
        return this._formatDuckDB('DOUBLE');
    }
}

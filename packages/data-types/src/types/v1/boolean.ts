import {
    xLuceneFieldType, ESFieldType, xLuceneTypeConfig,
    ESTypeMapping
} from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping, DuckDBTypeConfig } from '../../interfaces.js';

/**
 * A true/false value stored as an Elasticsearch/OpenSearch `boolean`.
 *
 * - **ES/OpenSearch mapping:** `{ type: 'boolean' }`. Honors `indexed: false`
 *   (emitted as `index: false`).
 * - **GraphQL:** `Boolean`.
 * - **xLucene:** `Boolean`.
 *
 * @example
 * const config: DataTypeConfig = {
 *     version: 1,
 *     fields: { is_active: { type: 'Boolean' } }
 * };
 */
export default class BooleanType extends BaseType {
    toESMapping(): TypeESMapping {
        this._validateESMapping();

        const config: ESTypeMapping = { type: 'boolean' as ESFieldType };

        if (this.config.indexed === false) config.index = false;

        return {
            mapping: {
                [this.field]: config
            }
        };
    }

    toGraphQL(): GraphQLType {
        return this._formatGql('Boolean');
    }

    toXlucene(): xLuceneTypeConfig {
        return { [this.field]: xLuceneFieldType.Boolean };
    }

    /**
     * The DuckDB column type for this field.
     */
    toDuckDB(): DuckDBTypeConfig {
        return this._formatDuckDB('BOOLEAN');
    }
}

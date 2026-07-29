import {
    xLuceneFieldType, ESFieldType, xLuceneTypeConfig,
    ESTypeMapping
} from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

/**
 * A whole number stored as an Elasticsearch/OpenSearch `integer`
 * (32-bit signed integer, −2^31 to 2^31 - 1).
 *
 * - **ES/OpenSearch mapping:** `{ type: 'integer' }`. Honors `indexed: false`
 *   (emitted as `index: false`).
 * - **GraphQL:** `Int` (the GraphQL `Int` scalar is also 32-bit signed, so it
 *   maps cleanly).
 * - **xLucene:** `Integer`.
 *
 * Use `Long` for values that exceed the 32-bit range.
 *
 * @example
 * const config: DataTypeConfig = {
 *     version: 1,
 *     fields: { count: { type: 'Integer' } }
 * };
 */
export default class Integer extends BaseType {
    toESMapping(): TypeESMapping {
        this._validateESMapping();

        const config: ESTypeMapping = { type: 'integer' as ESFieldType };

        if (this.config.indexed === false) config.index = false;

        return {
            mapping: {
                [this.field]: config
            }
        };
    }

    toGraphQL(): GraphQLType {
        return this._formatGql('Int');
    }

    toXlucene(): xLuceneTypeConfig {
        return { [this.field]: xLuceneFieldType.Integer };
    }
}

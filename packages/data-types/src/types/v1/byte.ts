import {
    xLuceneFieldType, ESFieldType, xLuceneTypeConfig,
    ESTypeMapping
} from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

/**
 * A whole number stored as an Elasticsearch/OpenSearch `byte`
 * (8-bit signed integer, -128 to 127).
 *
 * - **ES/OpenSearch mapping:** `{ type: 'byte' }`. Honors `indexed: false`
 *   (emitted as `index: false`).
 * - **GraphQL:** `Int`.
 * - **xLucene:** `Integer`.
 *
 * Prefer the smallest numeric type that fits the value range to save space;
 * use `Short`, `Integer`, or `Long` for larger values.
 *
 * @example
 * const config: DataTypeConfig = {
 *     version: 1,
 *     fields: { retries: { type: 'Byte' } }
 * };
 */
export default class Byte extends BaseType {
    toESMapping(): TypeESMapping {
        this._validateESMapping();

        const config: ESTypeMapping = { type: 'byte' as ESFieldType };

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

import {
    xLuceneFieldType, ESFieldType, xLuceneTypeConfig,
    ESTypeMapping
} from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

/**
 * A whole number stored as an Elasticsearch/OpenSearch `short`
 * (16-bit signed integer, -32,768 to 32,767).
 *
 * - **ES/OpenSearch mapping:** `{ type: 'short' }`. Honors `indexed: false`
 *   (emitted as `index: false`).
 * - **GraphQL:** `Int`.
 * - **xLucene:** `Integer`.
 *
 * Use `Integer` or `Long` for values outside the 16-bit range.
 *
 * @example
 * const config: DataTypeConfig = {
 *     version: 1,
 *     fields: { port_offset: { type: 'Short' } }
 * };
 */
export default class Short extends BaseType {
    toESMapping(): TypeESMapping {
        this._validateESMapping();

        const config: ESTypeMapping = { type: 'short' as ESFieldType };

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

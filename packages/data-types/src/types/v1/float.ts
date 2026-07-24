import {
    xLuceneFieldType, ESFieldType, xLuceneTypeConfig,
    ESTypeMapping
} from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

/**
 * A floating-point number stored as an Elasticsearch/OpenSearch `float`
 * (32-bit, single-precision IEEE 754).
 *
 * - **ES/OpenSearch mapping:** `{ type: 'float' }`. Honors `indexed: false`
 *   (emitted as `index: false`).
 * - **GraphQL:** `Float`.
 * - **xLucene:** `Float`.
 *
 * Use `Double` when single-precision is not accurate enough.
 *
 * @example
 * const config: DataTypeConfig = {
 *     version: 1,
 *     fields: { temperature: { type: 'Float' } }
 * };
 */
export default class Float extends BaseType {
    toESMapping(): TypeESMapping {
        this._validateESMapping();

        const config: ESTypeMapping = { type: 'float' as ESFieldType };

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
}

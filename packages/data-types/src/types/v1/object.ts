import { xLuceneFieldType, ESTypeMapping, xLuceneTypeConfig } from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

/**
 * A nested JSON object.
 *
 * - **ES/OpenSearch mapping:** `{ type: 'object' }`, or `{ type: 'nested' }`
 *   when `array: true`. The `nested` type preserves the independence of each
 *   array element for querying (an `object` array flattens its values). When
 *   `indexed: false` the object is disabled via `enabled: false` (not
 *   `index: false`).
 * - **GraphQL:** a `JSONObject` custom scalar (the `scalar JSONObject`
 *   definition is emitted alongside the field).
 * - **xLucene:** `Object`.
 *
 * @example
 * const config: DataTypeConfig = {
 *     version: 1,
 *     fields: { metadata: { type: 'Object' } }
 * };
 */
export default class ObjectType extends BaseType {
    toESMapping(): TypeESMapping {
        this._validateESMapping();

        const type = this.config.array ? 'nested' : 'object';
        const typeConfig: ESTypeMapping = { type };

        if (this.config.indexed === false) {
            typeConfig.enabled = false;
        }

        return { mapping: { [this.field]: typeConfig } };
    }

    toGraphQL(): GraphQLType {
        return this._formatGql('JSONObject', 'scalar JSONObject');
    }

    toXlucene(): xLuceneTypeConfig {
        return { [this.field]: xLuceneFieldType.Object };
    }
}

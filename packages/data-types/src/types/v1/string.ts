import {
    xLuceneFieldType, ESFieldType, xLuceneTypeConfig,
    ESTypeMapping
} from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

/**
 * A general-purpose string. Behaves like {@link Keyword} — the value is
 * stored as an Elasticsearch/OpenSearch `keyword` (exact match, not
 * analyzed) — but always maps to the GraphQL `String` scalar, with no special
 * handling for `_key`.
 *
 * - **ES/OpenSearch mapping:** `{ type: 'keyword' }`. Honors `indexed: false`
 *   (emitted as `index: false`).
 * - **GraphQL:** `String`.
 * - **xLucene:** `String`.
 *
 * Reach for `Text` when you need analyzed full-text search.
 *
 * @example
 * const config: DataTypeConfig = {
 *     version: 1,
 *     fields: { name: { type: 'String' } }
 * };
 */
export default class StringClass extends BaseType {
    toESMapping(): TypeESMapping {
        this._validateESMapping();

        const config: ESTypeMapping = { type: 'keyword' as ESFieldType };

        if (this.config.indexed === false) config.index = false;

        return {
            mapping: {
                [this.field]: config
            }
        };
    }

    toGraphQL(): GraphQLType {
        return this._formatGql('String');
    }

    toXlucene(): xLuceneTypeConfig {
        return { [this.field]: xLuceneFieldType.String };
    }
}

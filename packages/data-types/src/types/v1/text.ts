import {
    xLuceneFieldType, ESFieldType, xLuceneTypeConfig,
    ESTypeMapping
} from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

/**
 * A full-text string stored as an Elasticsearch/OpenSearch `text` field. The
 * value is passed through the standard analyzer (tokenized, lowercased), so
 * it supports full-text search but is **not** suited to exact-match filtering,
 * sorting, or aggregations — use `Keyword` for those.
 *
 * - **ES/OpenSearch mapping:** `{ type: 'text' }`. Honors `indexed: false`
 *   (emitted as `index: false`).
 * - **GraphQL:** `String`.
 * - **xLucene:** `String`.
 *
 * @example
 * const config: DataTypeConfig = {
 *     version: 1,
 *     fields: { description: { type: 'Text' } }
 * };
 */
export default class Text extends BaseType {
    toESMapping(): TypeESMapping {
        this._validateESMapping();

        const config: ESTypeMapping = { type: 'text' as ESFieldType };

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

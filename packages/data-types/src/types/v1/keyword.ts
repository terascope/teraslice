import {
    xLuceneFieldType, ESFieldType, xLuceneTypeConfig,
    ESTypeMapping
} from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

/**
 * An exact-match string stored as an Elasticsearch/OpenSearch `keyword`. The
 * value is indexed verbatim (not analyzed), so it is suited to filtering,
 * sorting, and aggregations rather than full-text search.
 *
 * - **ES/OpenSearch mapping:** `{ type: 'keyword' }`. Honors `indexed: false`
 *   (emitted as `index: false`).
 * - **GraphQL:** `String`, except when the field is named `_key`, which maps
 *   to the `ID` scalar so it can serve as a record's identity.
 * - **xLucene:** `String`.
 *
 * Use `Text` when you need analyzed full-text search, or one of the
 * `Keyword*` analyzer variants for case-insensitive / tokenized matching.
 *
 * @example
 * const config: DataTypeConfig = {
 *     version: 1,
 *     fields: { status: { type: 'Keyword' } }
 * };
 */
export default class Keyword extends BaseType {
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
        if (this.field === '_key') {
            return this._formatGql('ID');
        }
        return this._formatGql('String');
    }

    toXlucene(): xLuceneTypeConfig {
        return { [this.field]: xLuceneFieldType.String };
    }
}

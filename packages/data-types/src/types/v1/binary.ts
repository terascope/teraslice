import {
    xLuceneFieldType, ESFieldType, xLuceneTypeConfig,
    ESTypeMapping
} from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

/**
 * A Base64-encoded binary value stored as an Elasticsearch/OpenSearch
 * `binary` field.
 *
 * - **ES/OpenSearch mapping:** `{ type: 'binary', doc_values: false }`.
 *   `doc_values` is always forced off because binary fields are not
 *   searchable and can be very large. Honors `indexed: false` (emitted as
 *   `index: false`).
 * - **GraphQL:** `String`.
 * - **xLucene:** `String`.
 *
 * Because it is neither indexed for search nor stored as doc values, a
 * `Binary` field is opaque storage — you can retrieve it by `_source` but
 * cannot filter, sort, or aggregate on it. This can be useful to store
 * small files (thumbnails, audio, scripts, cryptographic keys, bit vectors)
 * that can be filtered, sorted, and aggregated by metadata fields stored
 * on the same record.
 *
 * @example
 * const config: DataTypeConfig = {
 *     version: 1,
 *     fields: { thumbnail: { type: 'Binary' } }
 * };
 */
export default class BinaryType extends BaseType {
    toESMapping(): TypeESMapping {
        this._validateESMapping();

        const config: ESTypeMapping = { type: 'binary' as ESFieldType };

        if (this.config.indexed === false) config.index = false;
        // we never want to store doc values for binary fields as
        //  they are not searchable and can be very large
        config.doc_values = false;

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

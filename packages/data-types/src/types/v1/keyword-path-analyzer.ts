import { xLuceneFieldType, ESFieldType, xLuceneTypeConfig } from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

/**
 * A keyword for slash-delimited paths (e.g. filesystem paths or URL paths).
 * The base value is an exact `keyword`, and a `tokens` sub-field is analyzed
 * with a custom `path_analyzer` that splits on `/` via a `pattern` tokenizer,
 * so a query can match on individual path segments.
 *
 * - **ES/OpenSearch mapping:** `{ type: 'keyword', fields: { tokens: { type:
 *   'text', analyzer: 'path_analyzer' } } }`, plus the custom `analyzer`
 *   (`path_analyzer`, type `custom`) and `tokenizer` (`path_tokenizer`, type
 *   `pattern`, pattern `/`) definitions.
 * - **GraphQL:** `String`.
 * - **xLucene:** `String`.
 *
 * @example
 * const config: DataTypeConfig = {
 *     version: 1,
 *     fields: { file_path: { type: 'KeywordPathAnalyzer' } }
 * };
 */
export default class KeywordPathAnalyzer extends BaseType {
    toESMapping(): TypeESMapping {
        this._validateESMapping();
        return {
            mapping: {
                [this.field]: {
                    type: 'keyword' as ESFieldType,
                    fields: {
                        tokens: {
                            type: 'text',
                            analyzer: 'path_analyzer',
                        },
                    },
                },
            },
            analyzer: {
                path_analyzer: {
                    type: 'custom',
                    tokenizer: 'path_tokenizer'
                }
            },
            tokenizer: {
                path_tokenizer: {
                    type: 'pattern',
                    pattern: '/'
                }
            },
        };
    }

    toGraphQL(): GraphQLType {
        return this._formatGql('String');
    }

    toXlucene(): xLuceneTypeConfig {
        return { [this.field]: xLuceneFieldType.String };
    }
}

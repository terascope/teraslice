import { xLuceneFieldType, ESFieldType, xLuceneTypeConfig } from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

/**
 * A keyword that supports substring matching via n-grams. The base value is
 * an exact `keyword`, and a `tokens` sub-field is analyzed with a custom
 * `ngram_analyzer` that emits fixed 3-character n-grams over digits only.
 *
 * - **ES/OpenSearch mapping:** `{ type: 'keyword', fields: { tokens: { type:
 *   'text', analyzer: 'ngram_analyzer' } } }`, plus the custom `analyzer`
 *   (`ngram_analyzer`) and `tokenizer` (`ngram_tokenizer`, type `ngram`,
 *   `min_gram: 3`, `max_gram: 3`, `token_chars: ['digit']`) definitions.
 * - **GraphQL:** `String`.
 * - **xLucene:** `String`.
 *
 * The tokenizer only grams digit characters, so this is aimed at numeric
 * strings (e.g. phone numbers, account numbers) rather than arbitrary text.
 *
 * @example
 * const config: DataTypeConfig = {
 *     version: 1,
 *     fields: { phone: { type: 'NgramTokens' } }
 * };
 */
export default class NgramTokens extends BaseType {
    toESMapping(): TypeESMapping {
        this._validateESMapping();
        return {
            mapping: {
                [this.field]: {
                    type: 'keyword' as ESFieldType,
                    fields: {
                        tokens: {
                            type: 'text' as ESFieldType,
                            analyzer: 'ngram_analyzer',
                        },
                    },
                },
            },
            analyzer: {
                ngram_analyzer: {
                    tokenizer: 'ngram_tokenizer',
                },
            },
            tokenizer: {
                ngram_tokenizer: {
                    type: 'ngram',
                    min_gram: 3,
                    max_gram: 3,
                    token_chars: ['digit'],
                },
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

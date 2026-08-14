import { xLuceneFieldType, ESFieldType, xLuceneTypeConfig } from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping, DuckDBTypeConfig } from '../../interfaces.js';

/**
 * A keyword that matches case-insensitively. It defines a custom
 * `lowercase_keyword_analyzer` (a `keyword` tokenizer plus a `lowercase`
 * filter) so the whole value is indexed as a single lowercased token.
 *
 * - **ES/OpenSearch mapping:** depends on `use_fields_hack`:
 *   - default → `{ type: 'text', analyzer: 'lowercase_keyword_analyzer' }`.
 *   - `use_fields_hack: true` → `{ type: 'keyword' }` with a `text` sub-field
 *     (`fields.text`) using the analyzer. This keeps an exact `keyword` for
 *     sorting/aggregations while still allowing case-insensitive matching on
 *     the sub-field. The mapping always emits the `analyzer` block defining
 *     `lowercase_keyword_analyzer`.
 * - **GraphQL:** `String`.
 * - **xLucene:** `AnalyzedString` by default, or `String` when
 *   `use_fields_hack` is set (because the base field is then a plain
 *   `keyword`).
 *
 * @example
 * const config: DataTypeConfig = {
 *     version: 1,
 *     fields: { username: { type: 'KeywordCaseInsensitive' } }
 * };
 */
export default class KeywordCaseInsensitive extends BaseType {
    toESMapping(): TypeESMapping {
        this._validateESMapping();
        return {
            mapping: {
                [this.field]: this.config.use_fields_hack
                    ? {
                        type: 'keyword',
                        fields: {
                            text: {
                                type: 'text',
                                analyzer: 'lowercase_keyword_analyzer',
                            },
                        },
                    }
                    : {
                        type: 'text' as ESFieldType,
                        analyzer: 'lowercase_keyword_analyzer',
                    },
            },
            analyzer: {
                lowercase_keyword_analyzer: {
                    tokenizer: 'keyword',
                    filter: 'lowercase',
                },
            },
        };
    }

    toGraphQL(): GraphQLType {
        return this._formatGql('String');
    }

    toXlucene(): xLuceneTypeConfig {
        if (this.config.use_fields_hack) {
            return {
                [this.field]: xLuceneFieldType.String
            };
        }
        return {
            [this.field]: xLuceneFieldType.AnalyzedString
        };
    }

    /**
     * The DuckDB column type for this field.
     */
    toDuckDB(): DuckDBTypeConfig {
        return this._formatDuckDB('VARCHAR');
    }
}

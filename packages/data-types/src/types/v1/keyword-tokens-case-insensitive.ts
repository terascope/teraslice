import { xLuceneFieldType, ESFieldType, xLuceneTypeConfig } from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping, DuckDBTypeConfig } from '../../interfaces.js';

/**
 * A case-insensitive keyword that also exposes a tokenized sub-field.
 * Combines the behavior of {@link KeywordCaseInsensitive} and
 * {@link KeywordTokens}: the base field is analyzed with the custom
 * `lowercase_keyword_analyzer` (single lowercased token), and a `tokens`
 * sub-field is analyzed with `standard` for word-level matching.
 *
 * - **ES/OpenSearch mapping:** `{ type: 'text', analyzer:
 *   'lowercase_keyword_analyzer', fields: { tokens: { type: 'text', analyzer:
 *   'standard' } } }`, plus the `analyzer` block defining
 *   `lowercase_keyword_analyzer` (`keyword` tokenizer + `lowercase` filter).
 * - **GraphQL:** `String`.
 * - **xLucene:** `String`.
 *
 * @example
 * const config: DataTypeConfig = {
 *     version: 1,
 *     fields: { display_name: { type: 'KeywordTokensCaseInsensitive' } }
 * };
 */
export default class KeywordTokensCaseInsensitive extends BaseType {
    toESMapping(): TypeESMapping {
        this._validateESMapping();
        return {
            mapping: {
                [this.field]: {
                    type: 'text' as ESFieldType,
                    analyzer: 'lowercase_keyword_analyzer',
                    fields: {
                        tokens: {
                            type: 'text' as ESFieldType,
                            analyzer: 'standard',
                        },
                    },
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
        return { [this.field]: xLuceneFieldType.String };
    }

    /**
     * The DuckDB column type for this field.
     */
    toDuckDB(): DuckDBTypeConfig {
        return this._formatDuckDB('VARCHAR');
    }
}

import { xLuceneFieldType, xLuceneTypeConfig } from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping, DuckDBTypeConfig } from '../../interfaces.js';

/**
 * An exact-match keyword that additionally exposes a tokenized sub-field for
 * full-text search. The base value is a `keyword` (exact match, sorting,
 * aggregations), and a `tokens` sub-field runs it through the `standard`
 * analyzer so individual words can be matched.
 *
 * - **ES/OpenSearch mapping:** `{ type: 'keyword', fields: { tokens: { type:
 *   'text', analyzer: 'standard' } } }`. Query `field.tokens` for word-level
 *   matches and `field` for exact matches.
 * - **GraphQL:** `String`.
 * - **xLucene:** `String`.
 *
 * @example
 * const config: DataTypeConfig = {
 *     version: 1,
 *     fields: { title: { type: 'KeywordTokens' } }
 * };
 */
export default class KeywordTokens extends BaseType {
    toESMapping(): TypeESMapping {
        this._validateESMapping();
        return {
            mapping: {
                [this.field]: {
                    type: 'keyword',
                    fields: {
                        tokens: {
                            type: 'text',
                            analyzer: 'standard',
                        },
                    },
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

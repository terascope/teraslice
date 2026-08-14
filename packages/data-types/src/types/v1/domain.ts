import { xLuceneFieldType, ESFieldType, xLuceneTypeConfig } from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping, DuckDBTypeConfig } from '../../interfaces.js';

/**
 * A domain name optimized for matching by domain suffix. The base value is
 * analyzed case-insensitively (`lowercase_keyword_analyzer`) and exposes two
 * sub-fields: `tokens` (the `standard` analyzer) and `right`, which uses a
 * reversed `path_hierarchy` tokenizer so a query can match on progressively
 * broader suffixes (e.g. `www.example.com` → `com`, `example.com`,
 * `www.example.com`).
 *
 * - **ES/OpenSearch mapping:** `{ type: 'text', analyzer:
 *   'lowercase_keyword_analyzer', fields: { tokens: …, right: … } }`, plus the
 *   custom `analyzer` (`lowercase_keyword_analyzer`, `domain_analyzer`) and
 *   `tokenizer` (`domain_tokens`, type `path_hierarchy`, `delimiter: '.'`,
 *   `reverse: 'true'`) definitions. The `right` sub-field uses
 *   `domain_analyzer` at index time and `lowercase_keyword_analyzer` as its
 *   `search_analyzer`.
 * - **GraphQL:** `String`.
 * - **xLucene:** `AnalyzedString`.
 *
 * @example
 * const config: DataTypeConfig = {
 *     version: 1,
 *     fields: { domain: { type: 'Domain' } }
 * };
 */
export default class Domain extends BaseType {
    override toESMapping(): TypeESMapping {
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
                        right: {
                            type: 'text' as ESFieldType,
                            analyzer: 'domain_analyzer',
                            search_analyzer: 'lowercase_keyword_analyzer',
                        },
                    },
                },
            },
            analyzer: {
                lowercase_keyword_analyzer: {
                    tokenizer: 'keyword',
                    filter: 'lowercase',
                },
                domain_analyzer: {
                    filter: 'lowercase',
                    type: 'custom',
                    tokenizer: 'domain_tokens',
                },
            },
            tokenizer: {
                domain_tokens: {
                    reverse: 'true',
                    type: 'path_hierarchy',
                    delimiter: '.',
                },
            },
        };
    }

    toGraphQL(): GraphQLType {
        return this._formatGql('String');
    }

    toXlucene(): xLuceneTypeConfig {
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

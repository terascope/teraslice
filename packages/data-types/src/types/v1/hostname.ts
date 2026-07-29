import { xLuceneFieldType, ESFieldType, xLuceneTypeConfig } from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

/**
 * A hostname. The base value is analyzed case-insensitively with the custom
 * `lowercase_keyword_analyzer` (single lowercased token), and a `tokens`
 * sub-field is split on `.` by a custom `hostname_analyzer` so individual
 * hostname labels can be matched.
 *
 * - **ES/OpenSearch mapping:** `{ type: 'text', analyzer:
 *   'lowercase_keyword_analyzer', fields: { tokens: { type: 'text', analyzer:
 *   'hostname_analyzer' } } }`, plus the custom `analyzer`
 *   (`hostname_analyzer`, `lowercase_keyword_analyzer`) and `tokenizer`
 *   (`hostname_tokenizer`, type `pattern`, pattern `\.`) definitions.
 * - **GraphQL:** `String`.
 * - **xLucene:** `String`.
 *
 * @example
 * const config: DataTypeConfig = {
 *     version: 1,
 *     fields: { host: { type: 'Hostname' } }
 * };
 */
export default class Hostname extends BaseType {
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
                            analyzer: 'hostname_analyzer',
                        },
                    },
                },
            },
            analyzer: {
                hostname_analyzer: {
                    type: 'custom',
                    tokenizer: 'hostname_tokenizer'
                },
                lowercase_keyword_analyzer: {
                    tokenizer: 'keyword',
                    filter: 'lowercase',
                }
            },
            tokenizer: {
                hostname_tokenizer: {
                    type: 'pattern',
                    pattern: '\\.'
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

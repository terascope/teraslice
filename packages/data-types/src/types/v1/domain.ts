import { xLuceneFieldType, ESFieldType, xLuceneTypeConfig } from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

export default class Domain extends BaseType {
    toESMapping(_version?: number): TypeESMapping {
        if (this.config.indexed === false) {
            throw new Error(`${this.constructor.name} is required to be indexed`);
        }
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
                    type: 'PathHierarchy',
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
}

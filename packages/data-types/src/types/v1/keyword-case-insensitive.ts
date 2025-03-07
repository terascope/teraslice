import { xLuceneFieldType, ESFieldType, xLuceneTypeConfig } from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

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
}

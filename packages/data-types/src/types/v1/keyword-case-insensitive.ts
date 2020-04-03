import { xLuceneFieldType, ESFieldType } from '@terascope/types';
import BaseType from '../base-type';

export default class KeywordCaseInsensitive extends BaseType {
    toESMapping(_version?: number) {
        return {
            mapping: {
                [this.field]: this.config.use_fields_hack ? {
                    type: 'keyword',
                    fields: {
                        text: {
                            type: 'text',
                            analyzer: 'lowercase_keyword_analyzer',
                        },
                    },
                } : {
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

    toGraphQL() {
        return this._formatGql('String');
    }

    toXlucene() {
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

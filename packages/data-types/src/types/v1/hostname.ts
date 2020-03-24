import { xLuceneFieldType, ESFieldType } from '@terascope/types';
import BaseType from '../base-type';

export default class Hostname extends BaseType {
    toESMapping(_version?: number) {
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

    toGraphQL() {
        return this._formatGql('String');
    }

    toXlucene() {
        return { [this.field]: xLuceneFieldType.String };
    }
}

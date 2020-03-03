import { xLuceneFieldType, ESFieldType } from '@terascope/types';
import BaseType from '../base-type';

export default class KeywordPathAnalyzer extends BaseType {
    toESMapping(_version?: number) {
        return {
            mapping: {
                [this.field]: {
                    type: 'keyword' as ESFieldType,
                    fields: {
                        tokens: {
                            type: 'text',
                            analyzer: 'path_analyzer',
                        },
                    },
                },
            },
            analyzer: {
                path_analyzer: {
                    type: 'custom',
                    tokenizer: 'path_tokenizer'
                }
            },
            tokenizer: {
                path_tokenizer: {
                    type: 'pattern',
                    pattern: '/'
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

import { XluceneFieldType } from '@terascope/types';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../interfaces';

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
                    type: 'text' as ElasticSearchTypes,
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
        return { [this.field]: XluceneFieldType.String };
    }
}

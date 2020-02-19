import { xLuceneFieldType } from '@terascope/types';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../interfaces';

export default class KeywordTokensCaseInsensitive extends BaseType {
    toESMapping(_version?: number) {
        return {
            mapping: {
                [this.field]: {
                    type: 'text' as ElasticSearchTypes,
                    analyzer: 'lowercase_keyword_analyzer',
                    fields: {
                        tokens: {
                            type: 'text' as ElasticSearchTypes,
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

    toGraphQL() {
        return this._formatGql('String');
    }

    toXlucene() {
        return { [this.field]: xLuceneFieldType.String };
    }
}

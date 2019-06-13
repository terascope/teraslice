import { FieldType } from 'xlucene-evaluator';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class KeywordCaseInsensitive extends BaseType {
    toESMapping(version?: number) {
        return {
            mapping: {
                [this.field]: {
                    // TODO: this is wrong, I dont think analyzer can be at this level
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
        return { type: this._formatGql('String') };
    }

    toXlucene() {
        return { [this.field]: 'string' as FieldType };
    }
}

import { FieldType } from 'xlucene-evaluator';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class NgramTokens extends BaseType {
    toESMapping(version?: number) {
        return {
            mapping: {
                [this.field]: {
                    // TODO: this is wrong, I dont think analyzer can be at this level
                    type: 'keyword' as ElasticSearchTypes,
                    fields: {
                        tokens: {
                            type: 'text' as ElasticSearchTypes,
                            analyzer: 'ngram_analyzer',
                        },
                    },
                },
            },
            analyzer: {
                ngram_analyzer: {
                    tokenizer: 'ngram_tokenizer',
                },
            },
            tokenizer: {
                ngram_tokenizer: {
                    type: 'ngram',
                    min_gram: 3,
                    max_gram: 3,
                    token_chars: ['digit'],
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

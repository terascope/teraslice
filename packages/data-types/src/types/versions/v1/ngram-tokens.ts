
import BaseType from '../base-type';
import { TypeConfig, ElasticSearchTypes } from '../../../interfaces';

export default class NgramTokens extends BaseType {
    constructor(field: string, config: TypeConfig) {
        super(field, config);
    }

    toESMapping(version?: number) {
        return {
            mapping: {
                [this.field]: {
                    // TODO: this is wrong, I dont think analyzer can be at this level
                    type: 'keyword' as ElasticSearchTypes,
                    fields: {
                        tokens: {
                            type: 'text' as ElasticSearchTypes,
                            analyzer: 'ngram_analyzer'
                        }
                    }
                }
            },
            analyzer: {
                ngram_analyzer: {
                    tokenizer: 'ngram_tokenizer'
                }
            },
            tokenizer: {
                ngram_tokenizer: {
                    type: 'ngram',
                    min_gram: 3,
                    max_gram: 3,
                    token_chars: [
                        'digit'
                    ]
                }
            }
        };
    }

    toGraphQl() {
        return { type: `${this.field}: String` };
    }

    toXlucene() {
        return { [this.field]: 'keyword' };
    }
}

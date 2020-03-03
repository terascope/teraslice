import { xLuceneFieldType, ESFieldType } from '@terascope/types';
import BaseType from '../base-type';

export default class NgramTokens extends BaseType {
    toESMapping(_version?: number) {
        return {
            mapping: {
                [this.field]: {
                    // TODO: this is wrong, I dont think analyzer can be at this level
                    type: 'keyword' as ESFieldType,
                    fields: {
                        tokens: {
                            type: 'text' as ESFieldType,
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
        return this._formatGql('String');
    }

    toXlucene() {
        return { [this.field]: xLuceneFieldType.String };
    }
}

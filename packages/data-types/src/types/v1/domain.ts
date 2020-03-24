import { xLuceneFieldType, ESFieldType } from '@terascope/types';
import BaseType from '../base-type';

export default class Domain extends BaseType {
    toESMapping(_version?: number) {
        return {
            mapping: {
                [this.field]: {
                    type: 'text' as ESFieldType,
                    analyzer: 'lowercase_keyword_analyzer',
                    fields: {
                        tokens: {
                            type: 'text' as ESFieldType,
                            analyzer: 'standard',
                        },
                        right: {
                            type: 'text' as ESFieldType,
                            analyzer: 'domain_analyzer',
                            search_analyzer: 'lowercase_keyword_analyzer',
                        },
                    },
                },
            },
            analyzer: {
                lowercase_keyword_analyzer: {
                    tokenizer: 'keyword',
                    filter: 'lowercase',
                },
                domain_analyzer: {
                    filter: 'lowercase',
                    type: 'custom',
                    tokenizer: 'domain_tokens',
                },
            },
            tokenizer: {
                domain_tokens: {
                    reverse: 'true',
                    type: 'PathHierarchy',
                    delimiter: '.',
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

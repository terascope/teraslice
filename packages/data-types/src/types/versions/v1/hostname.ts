import { FieldType } from 'xlucene-evaluator';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class Hostname extends BaseType {
    toESMapping(version?: number) {
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
                        right: {
                            type: 'text' as ElasticSearchTypes,
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
        return { type: this._formatGql('String') };
    }

    toXlucene() {
        return { [this.field]: 'string' as FieldType };
    }
}

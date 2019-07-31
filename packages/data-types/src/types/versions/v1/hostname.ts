import { FieldType } from 'xlucene-evaluator';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class Hostname extends BaseType {
    toESMapping(version?: number) {
        return {
            mapping: {
                [this.field]: {
                    type: 'keyword' as ElasticSearchTypes,
                    analyzer: 'lowercase_keyword_analyzer',
                    fields: {
                        tokens: {
                            type: 'text' as ElasticSearchTypes,
                            analyzer: 'hostname_analyzer',
                        },
                    },
                },
            },
            analyzer: {
                hostname_analyzer: {
                    type: 'custom',
                    tokenizer: 'hostname_tokenizer'
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
        return { [this.field]: 'string' as FieldType };
    }
}

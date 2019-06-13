import { FieldType } from 'xlucene-evaluator';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class KeywordTokens extends BaseType {
    toESMapping(version?: number) {
        return {
            mapping: {
                [this.field]: {
                    type: 'keyword' as ElasticSearchTypes,
                    fields: {
                        tokens: {
                            type: 'text',
                            index: 'true',
                            analyzer: 'simple',
                        },
                    },
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

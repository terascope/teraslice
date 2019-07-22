import { FieldType } from 'xlucene-evaluator';
import { ElasticSearchTypes } from '../../../interfaces';
import BaseType from '../base-type';

export default class KeywordTokens extends BaseType {
    toESMapping(version?: number) {
        return {
            mapping: {
                [this.field]: {
                    type: 'keyword' as ElasticSearchTypes,
                    fields: {
                        tokens: {
                            type: 'text' as ElasticSearchTypes,
                            index: 'true',
                            analyzer: 'simple',
                        },
                    },
                },
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

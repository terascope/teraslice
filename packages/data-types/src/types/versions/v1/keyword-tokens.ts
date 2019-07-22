import { FieldType } from 'xlucene-evaluator';
import BaseType from '../base-type';

export default class KeywordTokens extends BaseType {
    toESMapping(version?: number) {
        return {
            mapping: {
                [this.field]: {
                    type: 'keyword',
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
        return this._formatGql('String');
    }

    toXlucene() {
        return { [this.field]: 'string' as FieldType };
    }
}

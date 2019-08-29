import { FieldType } from 'xlucene-evaluator';
import BaseType from '../base-type';

export default class KeywordTokens extends BaseType {
    toESMapping(_version?: number) {
        return {
            mapping: {
                [this.field]: {
                    type: 'keyword',
                    fields: {
                        tokens: {
                            type: 'text',
                            analyzer: 'standard',
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
        return { [this.field]: FieldType.String };
    }
}

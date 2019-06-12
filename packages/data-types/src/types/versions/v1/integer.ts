import { FieldType } from 'xlucene-evaluator';

import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class Integer extends BaseType {

    toESMapping(version?: number) {
        return { mapping: { [this.field]: { type: 'integer' as ElasticSearchTypes } } };
    }

    toGraphQL() {
        return { type: `${this.field}: Int` };
    }

    toXlucene() {
        return { [this.field]: 'number' as FieldType };
    }
}

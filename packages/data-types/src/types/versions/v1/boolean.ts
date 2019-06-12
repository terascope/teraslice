import { FieldType } from 'xlucene-evaluator';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class BooleanType extends BaseType {

    toESMapping(version?: number) {
        return { mapping: { [this.field]: { type: 'boolean' as ElasticSearchTypes } } };
    }

    toGraphQL() {
        return { type: `${this.field}: Boolean` };
    }

    toXlucene() {
        return { [this.field]: 'boolean' as FieldType };
    }
}

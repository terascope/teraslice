import { FieldType } from 'xlucene-evaluator';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class DateType extends BaseType {

    toESMapping(version?: number) {
        return { mapping: { [this.field]: { type: 'date' as ElasticSearchTypes } } };
    }

    toGraphQL() {
        return { type: `${this.field}: DateTime` };
    }

    toXlucene() {
        return { [this.field]: 'date' as FieldType };
    }
}

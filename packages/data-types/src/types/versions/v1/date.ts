import { FieldType } from 'xlucene-evaluator';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class DateType extends BaseType {
    toESMapping(_version?: number) {
        return { mapping: { [this.field]: { type: 'date' as ElasticSearchTypes } } };
    }

    toGraphQL() {
        return this._formatGql('String');
    }

    toXlucene() {
        return { [this.field]: FieldType.Date };
    }
}

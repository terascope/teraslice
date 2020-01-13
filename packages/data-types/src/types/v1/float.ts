import { FieldType } from 'xlucene-evaluator';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../interfaces';

export default class Float extends BaseType {
    toESMapping(_version?: number) {
        return { mapping: { [this.field]: { type: 'float' as ElasticSearchTypes } } };
    }

    toGraphQL() {
        return this._formatGql('Float');
    }

    toXlucene() {
        return { [this.field]: FieldType.Float };
    }
}

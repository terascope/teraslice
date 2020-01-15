import { FieldType } from 'xlucene-evaluator';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../interfaces';

export default class Long extends BaseType {
    toESMapping(_version?: number) {
        return { mapping: { [this.field]: { type: 'long' as ElasticSearchTypes } } };
    }

    toGraphQL() {
        return this._formatGql('Int');
    }

    toXlucene() {
        return { [this.field]: FieldType.Integer };
    }
}

import { FieldType } from 'xlucene-evaluator';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class BooleanType extends BaseType {
    toESMapping(_version?: number) {
        return { mapping: { [this.field]: { type: 'boolean' as ElasticSearchTypes } } };
    }

    toGraphQL() {
        return this._formatGql('Boolean');
    }

    toXlucene() {
        return { [this.field]: FieldType.Boolean };
    }
}

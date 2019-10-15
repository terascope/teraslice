
import { FieldType } from 'xlucene-evaluator';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class ObjectType extends BaseType {
    toESMapping(_version?: number) {
        return { mapping: { [this.field]: { type: 'object' as ElasticSearchTypes } } };
    }

    toGraphQL() {
        return this._formatGql('JSONObject', 'scalar JSONObject');
    }

    toXlucene() {
        return { [this.field]: FieldType.Object };
    }
}

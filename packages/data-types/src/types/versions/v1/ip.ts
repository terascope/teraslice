import { FieldType } from 'xlucene-evaluator';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class IpType extends BaseType {

    toESMapping(version?: number) {
        return { mapping: { [this.field]: { type: 'ip' as ElasticSearchTypes } } };
    }

    toGraphQL() {
        return { type: `${this.field}: String` };
    }

    toXlucene() {
        return { [this.field]: 'ip' as FieldType };
    }
}

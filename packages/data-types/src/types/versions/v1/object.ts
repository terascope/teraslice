
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class ObjectType extends BaseType {

    toESMapping(version?: number) {
        return { mapping: { [this.field]: { type: 'object' as ElasticSearchTypes } } };
    }

    toGraphQL() {
        return { type: `${this.field}: JSON` };
    }

    toXlucene() {
        return { [this.field]: 'object' };
    }
}

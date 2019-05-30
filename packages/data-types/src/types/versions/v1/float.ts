
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class Float extends BaseType {

    toESMapping(version?: number) {
        return { mapping: { [this.field]: { type: 'float' as ElasticSearchTypes } } };
    }

    toGraphQl() {
        return { type: `${this.field}: Float` };
    }

    toXlucene() {
        return { [this.field]: 'float' };
    }
}


import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class Long extends BaseType {

    toESMapping(version?: number) {
        return { mapping: { [this.field]: { type: 'long' as ElasticSearchTypes } } };
    }

    toGraphQl() {
        return { type: `${this.field}: Int` };
    }

    toXlucene() {
        return { [this.field]: 'long' };
    }
}

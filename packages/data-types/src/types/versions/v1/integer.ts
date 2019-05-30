
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class Integer extends BaseType {

    toESMapping(version?: number) {
        return { mapping: { [this.field]: { type: 'integer' as ElasticSearchTypes } } };
    }

    toGraphQl() {
        return { type: `${this.field}: Int` };
    }

    toXlucene() {
        return { [this.field]: 'integer' };
    }
}


import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class Byte extends BaseType {

    toESMapping(version?: number) {
        return { mapping: { [this.field]: { type: 'byte' as ElasticSearchTypes } } };
    }

    toGraphQl() {
        return { type: `${this.field}: Int` };
    }

    toXlucene() {
        return { [this.field]: 'byte' };
    }
}

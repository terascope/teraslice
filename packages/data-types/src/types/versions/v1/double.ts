
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class Double extends BaseType {

    toESMapping(version?: number) {
        return { mapping: { [this.field]: { type:  'double' as ElasticSearchTypes } } };
    }

    toGraphQl() {
        return { type: `${this.field}: Int` };
    }

    toXlucene() {
        return { [this.field]: 'double' };
    }
}

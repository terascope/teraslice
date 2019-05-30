
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class IpType extends BaseType {

    toESMapping(version?: number) {
        return { mapping: { [this.field]: { type: 'ip' as ElasticSearchTypes } } };
    }

    toGraphQl() {
        return { type: `${this.field}: String` };
    }

    toXlucene() {
        return { [this.field]: 'ip' };
    }
}

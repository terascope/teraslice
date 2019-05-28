
import BaseType from '../base-type';
import { TypeConfig, ElasticSearchTypes } from '../../../interfaces';

export default class IpType extends BaseType {
    constructor(field: string, config: TypeConfig) {
        super(field, config);
    }

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

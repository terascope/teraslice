
import BaseType from '../base-type';
import { TypeConfig, ElasticSearchTypes } from '../../../interfaces';

export default class Float extends BaseType {
    constructor(field: string, config: TypeConfig) {
        super(field, config);
    }

    toESMapping() {
        return { mapping: { [this.field]: { type: 'float' as ElasticSearchTypes } } };
    }

    toGraphQl() {
        return { type: `${this.field}: Float` };
    }

    toXlucene() {
        return { [this.field]: 'float' };
    }
}

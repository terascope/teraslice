
import BaseType from '../base-type';
import { TypeConfig, ElasticSearchTypes } from '../../../interfaces';

export default class Short extends BaseType {
    constructor(field: string, config: TypeConfig) {
        super(field, config);
    }

    toESMapping() {
        return { mapping: { [this.field]: { type: 'short' as ElasticSearchTypes } } };
    }

    toGraphQl() {
        return { type: `${this.field}: Int` };
    }

    toXlucene() {
        return { [this.field]: 'short' };
    }
}

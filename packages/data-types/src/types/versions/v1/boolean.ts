
import BaseType from '../base-type';
import { TypeConfig, ElasticSearchTypes } from '../../../interfaces';

export default class BooleanType extends BaseType {
    constructor(field: string, config:TypeConfig) {
        super(field, config);
    }

    toESMapping() {
        return { mapping: { [this.field]: { type: 'boolean' as ElasticSearchTypes } } };
    }

    toGraphQl() {
        return { type: `${this.field}: Boolean` };
    }

    toXlucene() {
        return { [this.field]: 'boolean' };
    }
}

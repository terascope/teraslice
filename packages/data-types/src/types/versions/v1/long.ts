
import BaseType from '../base-type';
import { TypeConfig, ElasticSearchTypes } from '../../../interfaces';

export default class Long extends BaseType {
    constructor(field: string, config: TypeConfig) {
        super(field, config);
    }

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

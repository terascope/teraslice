
import BaseType from '../base-type';
import { TypeConfig, ElasticSearchTypes } from '../../../interfaces';

export default class Integer extends BaseType {
    constructor(field: string, config: TypeConfig) {
        super(field, config);
    }

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

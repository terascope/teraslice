
import BaseType from '../base-type';
import { TypeConfig, ElasticSearchTypes } from '../../../interfaces';

export default class Double extends BaseType {
    constructor(field: string, config: TypeConfig) {
        super(field, config);
    }

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

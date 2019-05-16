
import BaseType from '../base-type';
import { TypeConfig } from '../../../interfaces';

export default class Long extends BaseType {
    constructor(field: string, config: TypeConfig) {
        super(field, config);
    }

    toESMapping() {
        return { mapping: { [this.field]: 'long' } };
    }

    toGraphQl() {
        return { type: `${this.field}: Int` };
    }

    toXlucene() {
        return { [this.field]: 'long' };
    }
}

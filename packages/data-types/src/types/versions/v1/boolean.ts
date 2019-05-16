
import BaseType from '../base-type';
import { TypeConfig } from '../../../interfaces';

export default class BooleanType extends BaseType {
    constructor(field: string, config:TypeConfig) {
        super(field, config);
    }

    toESMapping() {
        return { mapping: { [this.field]: 'boolean' } };
    }

    toGraphQl() {
        return { type: `${this.field}: Boolean` };
    }

    toXlucene() {
        return { [this.field]: 'boolean' };
    }
}

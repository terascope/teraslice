
import BaseType from '../base-type';
import { TypeConfig } from '../../../interfaces';

export default class BooleanType extends BaseType {
    constructor(field: string, config:TypeConfig) {
        super(field, config);
    }

    toESMapping() {
        return { [this.field]: 'boolean' };
    }

    toGraphQl() {
        return `${this.field}: Boolean`;
    }

    toXlucene() {
        return { [this.field]: 'boolean' };
    }
}

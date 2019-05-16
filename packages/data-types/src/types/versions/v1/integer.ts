
import BaseType from '../base-type';
import { TypeConfig } from '../../../interfaces';

export default class Integer extends BaseType {
    constructor(field: string, config: TypeConfig) {
        super(field, config);
    }

    toESMapping() {
        return { [this.field]: 'integer' };
    }

    toGraphQl() {
        return `${this.field}: Int`;
    }

    toXlucene() {
        return { [this.field]: 'integer' };
    }
}


import BaseType from '../base-type';
import { TypeConfig } from '../../../interfaces';

export default class Short extends BaseType {
    constructor(field: string, config: TypeConfig) {
        super(field, config);
    }

    toESMapping() {
        return { [this.field]: 'short' };
    }

    toGraphQl() {
        return `${this.field}: Int`;
    }

    toXlucene() {
        return { [this.field]: 'short' };
    }
}


import BaseType from '../base-type';
import { TypeConfig } from '../../../interfaces';

export default class Byte extends BaseType {
    constructor(field: string, config: TypeConfig) {
        super(field, config);
    }

    toESMapping() {
        return { mapping: { [this.field]: 'byte' } };
    }

    toGraphQl() {
        return { type: `${this.field}: Int` };
    }

    toXlucene() {
        return { [this.field]: 'byte' };
    }
}

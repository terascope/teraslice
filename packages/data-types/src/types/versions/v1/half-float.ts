
import BaseType from '../base-type';
import { TypeConfig } from '../../../interfaces';

export default class HalfFloat extends BaseType {
    constructor(field: string, config: TypeConfig) {
        super(field, config);
    }

    toESMapping() {
        return { mapping: { [this.field]: 'half_float' } };
    }

    toGraphQl() {
        return { type: `${this.field}: Float` };
    }

    toXlucene() {
        return { [this.field]: 'half_float' };
    }
}

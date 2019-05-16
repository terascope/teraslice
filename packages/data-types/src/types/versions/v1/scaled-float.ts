
import BaseType from '../base-type';
import { TypeConfig } from '../../../interfaces';

export default class ScaledFloat extends BaseType {
    constructor(field: string, config: TypeConfig) {
        super(field, config);
    }

    toESMapping() {
        return { [this.field]: 'scaled_float' };
    }

    toGraphQl() {
        return { type: `${this.field}: Float` };
    }

    toXlucene() {
        return { [this.field]: 'scaled_float' };
    }
}

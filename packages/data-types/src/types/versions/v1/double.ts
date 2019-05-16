
import BaseType from '../base-type';
import { TypeConfig } from '../../../interfaces';

export default class Double extends BaseType {
    constructor(field: string, config: TypeConfig) {
        super(field, config);
    }

    toESMapping() {
        return { [this.field]: 'double' };
    }

    toGraphQl() {
        return `${this.field}: Int`;
    }

    toXlucene() {
        return { [this.field]: 'double' };
    }
}

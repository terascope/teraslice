
import BaseType from '../base-type';
import { TypeConfig } from '../../../interfaces';

export default class StringType extends BaseType {
    constructor(field: string, config: TypeConfig) {
        super(field, config);
    }

    toESMapping() {
        return { [this.field]: 'text' };
    }

    toGraphQl() {
        return { type: `${this.field}: String` };
    }

    toXlucene() {
        return { [this.field]: 'text' };
    }
}

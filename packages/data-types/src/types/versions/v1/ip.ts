
import BaseType from '../base-type';
import { TypeConfig } from '../../../interfaces';

export default class IpType extends BaseType {
    constructor(field: string, config: TypeConfig) {
        super(field, config);
    }

    toESMapping() {
        return { [this.field]: 'ip' };
    }

    toGraphQl() {
        return { type: `${this.field}: String` };
    }

    toXlucene() {
        return { [this.field]: 'ip' };
    }
}

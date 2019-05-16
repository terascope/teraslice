import BaseType from '../base-type';
import { TypeConfig } from '../../../interfaces';

export default class DateType extends BaseType {
    constructor(field: string, config:TypeConfig) {
        super(field, config);
    }
    // TODO: different date time settings?
    toESMapping() {
        return { [this.field]: 'date' };
    }

    toGraphQl() {
        return { type: `${this.field}: DateTime` };
    }

    toXlucene() {
        return { [this.field]: 'date' };
    }
}

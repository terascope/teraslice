import BaseType from '../base-type';
import { TypeConfig, ElasticSearchTypes } from '../../../interfaces';

export default class DateType extends BaseType {
    constructor(field: string, config:TypeConfig) {
        super(field, config);
    }
    // TODO: different date time settings?
    toESMapping() {
        return { mapping: { [this.field]: { type: 'date' as ElasticSearchTypes } } };
    }

    toGraphQl() {
        return { type: `${this.field}: DateTime` };
    }

    toXlucene() {
        return { [this.field]: 'date' };
    }
}

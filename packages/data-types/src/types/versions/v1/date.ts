import { Type } from '../../../interfaces';

export default class DateType implements Type {
    public baseType: string;
    public field: string;

    constructor(field: string) {
        this.baseType = 'boolean';
        this.field = field;
    }
    // TODO: different date time settings?
    toESMapping() {
        return { [this.field]: 'date' };
    }

    toGraphQl() {
        return `${this.field}: DateTime`;
    }

    toXlucene() {
        return { [this.field]: 'date' };
    }
}


import { Type } from '../../../interfaces';

export default class IpType implements Type {
    public baseType: string;
    public field: string;

    constructor(field: string) {
        this.baseType = 'Ip';
        this.field = field;
    }

    toESMapping() {
        return { [this.field]: 'ip' };
    }

    toGraphQl() {
        return `${this.field}: String`;
    }

    toXlucene() {
        return { [this.field]: 'ip' };
    }
}

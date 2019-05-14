
import { Type } from '../../../interfaces';

export default class BooleanType implements Type {
    public baseType: string;
    public field: string;

    constructor(field: string) {
        this.baseType = 'boolean';
        this.field = field;
    }

    toESMapping() {
        return { [this.field]: 'boolean' };
    }

    toGraphQl() {
        return `${this.field}: Boolean`;
    }

    toXlucene() {
        return { [this.field]: 'boolean' };
    }
}

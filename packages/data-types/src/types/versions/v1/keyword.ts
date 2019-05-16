
import BaseType from '../base-type';
import { TypeConfig } from '../../../interfaces';

export default class Keyword extends BaseType {
    constructor(field: string, config: TypeConfig) {
        super(field, config);
    }

    toESMapping() {
        return { [this.field]: 'keyword' };
    }

    toGraphQl() {
        return `${this.field}: String`;
    }

    toXlucene() {
        return { [this.field]: 'string' };
    }
}


import BaseType from '../base-type';
import { TypeConfig, ElasticSearchTypes } from '../../../interfaces';

export default class Keyword extends BaseType {
    constructor(field: string, config: TypeConfig) {
        super(field, config);
    }

    toESMapping() {
        return { mapping: { [this.field]: { type: 'keyword' as ElasticSearchTypes } } };
    }

    toGraphQl() {
        return { type: `${this.field}: String` };
    }

    toXlucene() {
        return { [this.field]: 'keyword' };
    }
}

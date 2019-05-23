
import BaseType from '../base-type';
import { TypeConfig, ElasticSearchTypes } from '../../../interfaces';

export default class Text extends BaseType {
    constructor(field: string, config: TypeConfig) {
        super(field, config);
    }

    toESMapping() {
        return { mapping: { [this.field]: { type: 'text' as ElasticSearchTypes } } };
    }

    toGraphQl() {
        return { type: `${this.field}: String` };
    }

    toXlucene() {
        return { [this.field]: 'text' };
    }
}

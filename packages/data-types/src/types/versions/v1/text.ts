
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class Text extends BaseType {

    toESMapping(version?: number) {
        return { mapping: { [this.field]: { type: 'text' as ElasticSearchTypes } } };
    }

    toGraphQl() {
        return { type: `${this.field}: String` };
    }

    toXlucene() {
        return { [this.field]: 'text' };
    }
}

import { FieldType } from 'xlucene-evaluator';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class Text extends BaseType {

    toESMapping(version?: number) {
        return { mapping: { [this.field]: { type: 'text' as ElasticSearchTypes } } };
    }

    toGraphQL() {
        return { type: `${this.field}: String` };
    }

    toXlucene() {
        return { [this.field]: 'string' as FieldType  };
    }
}

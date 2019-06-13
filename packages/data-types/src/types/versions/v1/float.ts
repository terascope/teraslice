import { FieldType } from 'xlucene-evaluator';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class Float extends BaseType {
    toESMapping(version?: number) {
        return { mapping: { [this.field]: { type: 'float' as ElasticSearchTypes } } };
    }

    toGraphQL() {
        return { type: this._formatGql('Float') };
    }

    toXlucene() {
        return { [this.field]: 'float' as FieldType };
    }
}

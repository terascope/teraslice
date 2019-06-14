import { FieldType } from 'xlucene-evaluator';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class Short extends BaseType {
    toESMapping(version?: number) {
        return { mapping: { [this.field]: { type: 'short' as ElasticSearchTypes } } };
    }

    toGraphQL() {
        return { type: this._formatGql('Int') };
    }

    toXlucene() {
        return { [this.field]: 'number' as FieldType };
    }
}

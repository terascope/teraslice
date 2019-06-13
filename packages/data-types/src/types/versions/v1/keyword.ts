import { FieldType } from 'xlucene-evaluator';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class Keyword extends BaseType {
    toESMapping(version?: number) {
        return { mapping: { [this.field]: { type: 'keyword' as ElasticSearchTypes } } };
    }

    toGraphQL() {
        return { type: this._formatGql('String') };
    }

    toXlucene() {
        return { [this.field]: 'string' as FieldType };
    }
}

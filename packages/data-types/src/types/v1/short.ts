import { XluceneFieldType } from '@terascope/types';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../interfaces';

export default class Short extends BaseType {
    toESMapping(_version?: number) {
        return { mapping: { [this.field]: { type: 'short' as ElasticSearchTypes } } };
    }

    toGraphQL() {
        return this._formatGql('Int');
    }

    toXlucene() {
        return { [this.field]: XluceneFieldType.Integer };
    }
}

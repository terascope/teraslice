import { xLuceneFieldType } from '@terascope/types';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../interfaces';

export default class Keyword extends BaseType {
    toESMapping(_version?: number) {
        return { mapping: { [this.field]: { type: 'keyword' as ElasticSearchTypes } } };
    }

    toGraphQL() {
        if (this.field === '_key') {
            return this._formatGql('ID');
        }
        return this._formatGql('String');
    }

    toXlucene() {
        return { [this.field]: xLuceneFieldType.String };
    }
}

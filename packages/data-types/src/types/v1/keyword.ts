import { xLuceneFieldType, ESFieldType } from '@terascope/types';
import BaseType from '../base-type';

export default class Keyword extends BaseType {
    toESMapping(_version?: number) {
        return { mapping: { [this.field]: { type: 'keyword' as ESFieldType } } };
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

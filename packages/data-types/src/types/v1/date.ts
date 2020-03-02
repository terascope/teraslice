import { xLuceneFieldType, ESFieldType } from '@terascope/types';
import BaseType from '../base-type';

export default class DateType extends BaseType {
    toESMapping(_version?: number) {
        return { mapping: { [this.field]: { type: 'date' as ESFieldType } } };
    }

    toGraphQL() {
        return this._formatGql('String');
    }

    toXlucene() {
        return { [this.field]: xLuceneFieldType.Date };
    }
}

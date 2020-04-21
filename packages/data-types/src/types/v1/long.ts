import { xLuceneFieldType, ESFieldType } from '@terascope/types';
import BaseType from '../base-type';

export default class Long extends BaseType {
    toESMapping(_version?: number) {
        return { mapping: { [this.field]: { type: 'long' as ESFieldType } } };
    }

    toGraphQL() {
        return this._formatGql('Float');
    }

    toXlucene() {
        return { [this.field]: xLuceneFieldType.Integer };
    }
}

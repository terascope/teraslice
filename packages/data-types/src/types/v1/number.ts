import { xLuceneFieldType, ESFieldType } from '@terascope/types';
import BaseType from '../base-type';

export default class NumberClass extends BaseType {
    toESMapping(_version?: number) {
        return { mapping: { [this.field]: { type: 'double' as ESFieldType } } };
    }

    toGraphQL() {
        return this._formatGql('Float');
    }

    toXlucene() {
        return { [this.field]: xLuceneFieldType.Number };
    }
}

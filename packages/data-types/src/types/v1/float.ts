import { xLuceneFieldType, ESFieldType } from '@terascope/types';
import BaseType from '../base-type';

export default class Float extends BaseType {
    toESMapping(_version?: number) {
        return { mapping: { [this.field]: { type: 'float' as ESFieldType } } };
    }

    toGraphQL() {
        return this._formatGql('Float');
    }

    toXlucene() {
        return { [this.field]: xLuceneFieldType.Float };
    }
}

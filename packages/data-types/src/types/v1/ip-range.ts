import { xLuceneFieldType, ESFieldType } from '@terascope/types';
import BaseType from '../base-type';

export default class IpRangeType extends BaseType {
    toESMapping(_version?: number) {
        return { mapping: { [this.field]: { type: 'ip_range' as ESFieldType } } };
    }

    toGraphQL() {
        return this._formatGql('String');
    }

    toXlucene() {
        return { [this.field]: xLuceneFieldType.IP };
    }
}

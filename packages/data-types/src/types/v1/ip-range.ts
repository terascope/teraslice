import { xLuceneFieldType } from '@terascope/types';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../interfaces';

export default class IpRangeType extends BaseType {
    toESMapping(_version?: number) {
        return { mapping: { [this.field]: { type: 'ip_range' as ElasticSearchTypes } } };
    }

    toGraphQL() {
        return this._formatGql('String');
    }

    toXlucene() {
        return { [this.field]: xLuceneFieldType.IP };
    }
}

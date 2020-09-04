import { xLuceneFieldType, ESFieldType, xLuceneTypeConfig } from '@terascope/types';
import BaseType from '../base-type';
import { GraphQLType, TypeESMapping } from '../../interfaces';

export default class IpRangeType extends BaseType {
    toESMapping(_version?: number): TypeESMapping {
        return { mapping: { [this.field]: { type: 'ip_range' as ESFieldType } } };
    }

    toGraphQL(): GraphQLType {
        return this._formatGql('String');
    }

    toXlucene(): xLuceneTypeConfig {
        return { [this.field]: xLuceneFieldType.IPRange };
    }
}

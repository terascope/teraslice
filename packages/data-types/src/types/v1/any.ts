import { xLuceneTypeConfig } from '@terascope/types';
import BaseType from '../base-type';
import { GraphQLType, TypeESMapping } from '../../interfaces';

export default class AnyType extends BaseType {
    toESMapping(): TypeESMapping {
        return {
            mapping: { [this.field]: { enabled: false } }
        };
    }

    toGraphQL(): GraphQLType {
        return this._formatGql('JSON');
    }

    toXlucene(): xLuceneTypeConfig {
        return {};
    }
}

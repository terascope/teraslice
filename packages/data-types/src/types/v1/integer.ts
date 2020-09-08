import { xLuceneFieldType, ESFieldType, xLuceneTypeConfig } from '@terascope/types';
import BaseType from '../base-type';
import { GraphQLType, TypeESMapping } from '../../interfaces';

export default class Integer extends BaseType {
    toESMapping(_version?: number): TypeESMapping {
        return { mapping: { [this.field]: { type: 'integer' as ESFieldType } } };
    }

    toGraphQL(): GraphQLType {
        return this._formatGql('Int');
    }

    toXlucene(): xLuceneTypeConfig {
        return { [this.field]: xLuceneFieldType.Integer };
    }
}

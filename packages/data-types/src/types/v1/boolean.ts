import { xLuceneFieldType, ESFieldType, xLuceneTypeConfig } from '@terascope/types';
import BaseType from '../base-type';
import { GraphQLType, TypeESMapping } from '../../interfaces';

export default class BooleanType extends BaseType {
    toESMapping(_version?: number): TypeESMapping {
        return {
            mapping: {
                [this.field]: {
                    type: 'boolean' as ESFieldType
                }
            }
        };
    }

    toGraphQL(): GraphQLType {
        return this._formatGql('Boolean');
    }

    toXlucene(): xLuceneTypeConfig {
        return { [this.field]: xLuceneFieldType.Boolean };
    }
}

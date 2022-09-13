import { xLuceneFieldType, ESFieldType, xLuceneTypeConfig } from '@terascope/types';
import BaseType from '../base-type';
import { GraphQLType, TypeESMapping } from '../../interfaces';

export default class StringClass extends BaseType {
    toESMapping(): TypeESMapping {
        return {
            mapping: {
                [this.field]: this.config.indexed === false ? {
                    type: 'keyword' as ESFieldType,
                    index: false
                } : {
                    type: 'keyword' as ESFieldType
                }
            }
        };
    }

    toGraphQL(): GraphQLType {
        return this._formatGql('String');
    }

    toXlucene(): xLuceneTypeConfig {
        return { [this.field]: xLuceneFieldType.String };
    }
}

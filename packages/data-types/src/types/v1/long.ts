import { xLuceneFieldType, ESFieldType, xLuceneTypeConfig } from '@terascope/types';
import BaseType from '../base-type';
import { GraphQLType, TypeESMapping } from '../../interfaces';

export default class Long extends BaseType {
    toESMapping(): TypeESMapping {
        this.validateESMapping();
        return {
            mapping: {
                [this.field]: this.config.indexed === false ? {
                    type: 'long' as ESFieldType,
                    index: false
                } : {
                    type: 'long' as ESFieldType
                }
            }
        };
    }

    toGraphQL(): GraphQLType {
        return this._formatGql('Float');
    }

    toXlucene(): xLuceneTypeConfig {
        return { [this.field]: xLuceneFieldType.Integer };
    }
}

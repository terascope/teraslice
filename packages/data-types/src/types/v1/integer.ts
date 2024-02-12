import { xLuceneFieldType, ESFieldType, xLuceneTypeConfig } from '@terascope/types';
import BaseType from '../base-type';
import { GraphQLType, TypeESMapping } from '../../interfaces';

export default class Integer extends BaseType {
    toESMapping(): TypeESMapping {
        this._validateESMapping();
        return {
            mapping: {
                [this.field]: this.config.indexed === false ? {
                    type: 'integer' as ESFieldType,
                    index: false
                } : {
                    type: 'integer' as ESFieldType
                }
            }
        };
    }

    toGraphQL(): GraphQLType {
        return this._formatGql('Int');
    }

    toXlucene(): xLuceneTypeConfig {
        return { [this.field]: xLuceneFieldType.Integer };
    }
}

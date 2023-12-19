import { xLuceneFieldType, ESFieldType, xLuceneTypeConfig } from '@terascope/types';
import BaseType from '../base-type';
import { GraphQLType, TypeESMapping } from '../../interfaces';

export default class Text extends BaseType {
    toESMapping(): TypeESMapping {
        this.validateESMapping();
        return {
            mapping: {
                [this.field]: this.config.indexed === false ? {
                    type: 'text' as ESFieldType,
                    index: false
                } : {
                    type: 'text' as ESFieldType
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

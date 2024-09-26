import { xLuceneFieldType, ESFieldType, xLuceneTypeConfig } from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

export default class Short extends BaseType {
    toESMapping(): TypeESMapping {
        this._validateESMapping();
        return {
            mapping: {
                [this.field]: this.config.indexed === false
                    ? {
                        type: 'short' as ESFieldType,
                        index: false
                    }
                    : {
                        type: 'short' as ESFieldType
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

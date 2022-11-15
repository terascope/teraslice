import { xLuceneFieldType, ESFieldType, xLuceneTypeConfig } from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

export default class Keyword extends BaseType {
    toESMapping(_version?: number): TypeESMapping {
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
        if (this.field === '_key') {
            return this._formatGql('ID');
        }
        return this._formatGql('String');
    }

    toXlucene(): xLuceneTypeConfig {
        return { [this.field]: xLuceneFieldType.String };
    }
}

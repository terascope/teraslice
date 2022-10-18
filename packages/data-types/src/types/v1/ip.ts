import { xLuceneFieldType, ESFieldType, xLuceneTypeConfig } from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

export default class IPType extends BaseType {
    toESMapping(_version?: number): TypeESMapping {
        return {
            mapping: {
                [this.field]: this.config.indexed === false ? {
                    type: 'ip' as ESFieldType,
                    index: false
                } : {
                    type: 'ip' as ESFieldType
                }
            }
        };
    }

    toGraphQL(): GraphQLType {
        return this._formatGql('String');
    }

    toXlucene(): xLuceneTypeConfig {
        return { [this.field]: xLuceneFieldType.IP };
    }
}

import { xLuceneTypeConfig } from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

export default class AnyType extends BaseType {
    toESMapping(_version?: number): TypeESMapping {
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

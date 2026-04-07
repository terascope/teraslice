import { xLuceneTypeConfig, AnyFieldMapping } from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

export default class AnyType extends BaseType {
    toESMapping(): TypeESMapping {
        this._validateESMapping();

        const config: AnyFieldMapping = { enabled: false };

        return {
            mapping: { [this.field]: config }
        };
    }

    toGraphQL(): GraphQLType {
        return this._formatGql('JSON');
    }

    toXlucene(): xLuceneTypeConfig {
        return {};
    }
}

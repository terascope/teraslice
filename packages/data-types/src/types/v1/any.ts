import { xLuceneTypeConfig, AnyFieldMapping } from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

export default class AnyType extends BaseType {
    toESMapping(): TypeESMapping {
        this._validateESMapping();

        const config: AnyFieldMapping = { enabled: false };

        if (this.config.indexed === false) config.index = false;
        if (this.config.doc_values === false) config.doc_values = false;

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

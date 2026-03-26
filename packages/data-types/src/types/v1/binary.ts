import { xLuceneFieldType, ESFieldType, xLuceneTypeConfig, ESTypeMapping } from '@terascope/types';
import BaseType from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

export default class BinaryType extends BaseType {
    toESMapping(): TypeESMapping {
        this._validateESMapping();

        const config = { type: 'binary' as ESFieldType } as ESTypeMapping;

        // @ts-expect-error
        if (this.config.indexed === false) config.index = false;
        // @ts-expect-error
        if (this.config.doc_values === false) config.doc_values = false;

        return {
            mapping: {
                [this.field]: config
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

import { xLuceneFieldType, ESTypeMapping, xLuceneTypeConfig } from '@terascope/types';
import BaseType from '../base-type';
import { GraphQLType, TypeESMapping } from '../../interfaces';

export default class ObjectType extends BaseType {
    toESMapping(): TypeESMapping {
        this._validateESMapping();

        const type = this.config.array ? 'nested' : 'object';
        const typeConfig: ESTypeMapping = { type };

        if (this.config.indexed === false) {
            typeConfig.enabled = false;
        }

        return { mapping: { [this.field]: typeConfig } };
    }

    toGraphQL(): GraphQLType {
        return this._formatGql('JSONObject', 'scalar JSONObject');
    }

    toXlucene(): xLuceneTypeConfig {
        return { [this.field]: xLuceneFieldType.Object };
    }
}

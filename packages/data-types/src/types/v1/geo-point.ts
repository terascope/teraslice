import {
    xLuceneFieldType, ESFieldType, xLuceneTypeConfig,
    ESTypeMapping
} from '@terascope/types';
import BaseType, { ToGraphQLOptions } from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

export default class GeoPointType extends BaseType {
    toESMapping(): TypeESMapping {
        this._validateESMapping();

        const config: ESTypeMapping = { type: 'geo_point' as ESFieldType };

        if (this.config.indexed === false) config.index = false;
        if (this.config.doc_values === false) config.doc_values = false;
        if (this.config.enabled === false) config.enabled = false;

        return {
            mapping: {
                [this.field]: config
            }
        };
    }

    toGraphQL({ isInput }: ToGraphQLOptions = {}): GraphQLType {
        const defType = isInput ? 'input' : 'type';
        const name = this._formatGQLTypeName('GeoPoint', isInput);
        const customType = `
            ${defType} ${name} {
                lat: String!
                lon: String!
            }
        `;
        return this._formatGql(name, customType);
    }

    toXlucene(): xLuceneTypeConfig {
        return { [this.field]: xLuceneFieldType.GeoPoint };
    }
}

import { xLuceneFieldType, ESFieldType, xLuceneTypeConfig } from '@terascope/types';
import BaseType, { ToGraphQLOptions } from '../base-type';
import { GraphQLType, TypeESMapping } from '../../interfaces';

export default class GeoPointType extends BaseType {
    toESMapping(): TypeESMapping {
        return {
            mapping: {
                [this.field]: this.config.indexed === false ? {
                    type: 'geo_point' as ESFieldType,
                    index: false
                } : { type: 'geo_point' as ESFieldType }
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

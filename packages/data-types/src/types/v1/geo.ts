import { xLuceneFieldType, ESFieldType, xLuceneTypeConfig } from '@terascope/types';
import BaseType, { ToGraphQLOptions } from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

// TODO: This type is deprecated, not sure how to properly indicate it.
export default class GeoType extends BaseType {
    toESMapping(_version?: number): TypeESMapping {
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
        return { [this.field]: xLuceneFieldType.Geo };
    }
}

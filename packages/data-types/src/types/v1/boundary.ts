import { xLuceneFieldType, ESFieldType, xLuceneTypeConfig } from '@terascope/types';
import BaseType, { ToGraphQLOptions } from '../base-type';
import { GraphQLType, TypeESMapping } from '../../interfaces';

export default class Boundary extends BaseType {
    toESMapping(): TypeESMapping {
        this._validateESMapping();
        return {
            mapping: {
                [this.field]: this.config.indexed === false ? {
                    properties: {
                        lat: { type: 'float' as ESFieldType },
                        lon: { type: 'float' as ESFieldType },
                    },
                    enabled: false
                } : {
                    properties: {
                        lat: { type: 'float' as ESFieldType },
                        lon: { type: 'float' as ESFieldType },
                    },
                },
            },
        };
    }

    toGraphQL({ isInput }: ToGraphQLOptions = {}): GraphQLType {
        const defType = isInput ? 'input' : 'type';
        const name = this._formatGQLTypeName('GeoBoundary', isInput);
        const customType = `
            ${defType} ${name} {
                lat: Float!
                lon: Float!
            }
        `;
        return this._formatGql(`[${name}]`, customType);
    }

    toXlucene(): xLuceneTypeConfig {
        return { [this.field]: xLuceneFieldType.Geo };
    }
}

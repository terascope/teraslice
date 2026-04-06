import {
    xLuceneFieldType, ESFieldType, xLuceneTypeConfig,
    ESTypeMapping
} from '@terascope/types';
import BaseType, { ToGraphQLOptions } from '../base-type.js';
import { GraphQLType, TypeESMapping } from '../../interfaces.js';

export default class Boundary extends BaseType {
    toESMapping(): TypeESMapping {
        this._validateESMapping();

        const config: ESTypeMapping = {
            type: 'object' as ESFieldType,
            properties: {
                lat: { type: 'float' as ESFieldType },
                lon: { type: 'float' as ESFieldType },
            },
        };

        if (this.config.indexed === false) config.index = false;

        return {
            mapping: {
                [this.field]: config
            }
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

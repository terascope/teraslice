import { xLuceneFieldType, ESFieldType } from '@terascope/types';
import BaseType, { ToGraphQLOptions } from '../base-type';

export default class Boundary extends BaseType {
    toESMapping(_version?: number) {
        return {
            mapping: {
                [this.field]: {
                    properties: {
                        lat: { type: 'float' as ESFieldType },
                        lon: { type: 'float' as ESFieldType },
                    },
                },
            },
        };
    }

    toGraphQL({ isInput }: ToGraphQLOptions = {}) {
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

    toXlucene() {
        return { [this.field]: xLuceneFieldType.Geo };
    }
}

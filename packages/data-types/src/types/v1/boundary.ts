import { XluceneFieldType } from '@terascope/types';
import BaseType, { ToGraphQLOptions } from '../base-type';
import { ElasticSearchTypes } from '../../interfaces';

export default class Boundary extends BaseType {
    toESMapping(_version?: number) {
        return {
            mapping: {
                [this.field]: {
                    properties: {
                        lat: { type: 'float' as ElasticSearchTypes },
                        lon: { type: 'float' as ElasticSearchTypes },
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
        return { [this.field]: XluceneFieldType.Geo };
    }
}

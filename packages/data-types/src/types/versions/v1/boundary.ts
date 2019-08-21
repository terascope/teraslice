import { FieldType } from 'xlucene-evaluator';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class Boundary extends BaseType {
    toESMapping(version?: number) {
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

    toGraphQL() {
        const customType = `
            type GeoBoundaryType {
                lat: Int!
                lon: Int!
            }
        `;
        return this._formatGql('GeoBoundaryType', customType);
    }

    toXlucene() {
        return { [this.field]: FieldType.Geo };
    }
}

import { FieldType } from 'xlucene-evaluator';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

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

    toGraphQL(_typeName?: string, isInput?: boolean) {
        const defType = isInput ? 'input' : 'type';
        const name = this._formatGQLTypeName('GeoBoundary', isInput);
        const customType = `
            ${defType} ${name} {
                lat: Float!
                lon: Float!
            }
        `;
        return this._formatGql(name, customType);
    }

    toXlucene() {
        return { [this.field]: FieldType.Geo };
    }
}

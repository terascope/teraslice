import { FieldType } from 'xlucene-evaluator';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class Boundary extends BaseType {

    toESMapping(version?: number) {
        return {
            mapping: {
                [this.field]:{
                    properties: {
                        lat: { type: 'float' as ElasticSearchTypes },
                        lon: { type: 'float' as ElasticSearchTypes }
                    }
                }
            }
        };
    }

    toGraphQL() {
        const customType = `
        type GeoNumb {
            lat: Int!
            lon: Int!
        }
    `;
        return { type: `${this.field}: Geo`, custom_type: customType  };
    }

    toXlucene() {
        return { [this.field]: 'geo' as FieldType };
    }
}

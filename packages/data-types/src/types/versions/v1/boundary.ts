
import BaseType from '../base-type';
import { TypeConfig, ElasticSearchTypes } from '../../../interfaces';

export default class Boundary extends BaseType {
    constructor(field: string, config: TypeConfig) {
        super(field, config);
    }

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

    toGraphQl() {
        const customType = `
        type GeoNumb {
            lat: Int!
            lon: Int!
        }
    `;
        return { type: `${this.field}: Geo`, custom_type: customType  };
    }

    toXlucene() {
        return { [this.field]: 'geo' };
    }
}

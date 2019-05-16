import BaseType from '../base-type';
import { TypeConfig } from '../../../interfaces';

export default class GeoType extends BaseType {
    constructor(field: string, config:TypeConfig) {
        super(field, config);
    }

    toESMapping() {
        return { mapping: { [this.field]: 'geo_point' } };
    }
    // TODO: need notion of injecting custom types, what about duplicates
    toGraphQl() {
        const customType = `
            type Geo {
                lat: String!
                lon: String!
            }
        `;
        return { type: `${this.field}: Geo`, custom_type: customType  };
    }

    toXlucene() {
        return { [this.field]: 'geo' };
    }
}

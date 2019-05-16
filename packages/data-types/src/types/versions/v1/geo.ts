import BaseType from '../base-type';
import { TypeConfig } from '../../../interfaces';

export default class GeoType extends BaseType {
    constructor(field: string, config:TypeConfig) {
        super(field, config);
    }

    toESMapping() {
        return { [this.field]: 'geo_point' };
    }
    // TODO: need notion of injecting custom types, what about duplicates
    toGraphQl() {
        /*
            type Geo {
                lat: String!
                lon: String!
            }
        */
        return `${this.field}: Geo`;
    }

    toXlucene() {
        return { [this.field]: 'geo' };
    }
}

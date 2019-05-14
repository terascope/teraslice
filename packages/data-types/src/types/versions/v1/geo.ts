import { Type } from '../../../interfaces';

export default class GeoType implements Type {
    public baseType: string;
    public field: string;

    constructor(field: string) {
        this.baseType = 'geo';
        this.field = field;
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

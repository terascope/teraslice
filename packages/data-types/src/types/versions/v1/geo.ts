import { FieldType } from 'xlucene-evaluator';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class GeoType extends BaseType {
    toESMapping() {
        return { mapping: { [this.field]: { type: 'geo_point' as ElasticSearchTypes } } };
    }
    // TODO: need notion of injecting custom types, what about duplicates
    toGraphQL() {
        const customType = `
            type GeoPointType {
                lat: String!
                lon: String!
            }
        `;
        return { type: this._formatGql('GeoPointType'), custom_type: customType };
    }

    toXlucene() {
        return { [this.field]: 'geo' as FieldType };
    }
}

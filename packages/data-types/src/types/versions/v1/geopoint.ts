import { FieldType } from 'xlucene-evaluator';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class GeoPointType extends BaseType {
    toESMapping(_version?: number) {
        return { mapping: { [this.field]: { type: 'geo_point' as ElasticSearchTypes } } };
    }

    // TODO: need notion of injecting custom types, what about duplicates
    toGraphQL() {
        const customType = `
            type DTGeoPointV1 {
                lat: String!
                lon: String!
            }
        `;
        return this._formatGql('DTGeoPointV1', customType);
    }

    toXlucene() {
        return { [this.field]: FieldType.Geo };
    }
}

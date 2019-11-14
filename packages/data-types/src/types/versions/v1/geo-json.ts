import { FieldType } from 'xlucene-evaluator';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class GeoJSON extends BaseType {
    toESMapping(_version?: number) {
        return { mapping: { [this.field]: { type: 'geo_shape' as ElasticSearchTypes } } };
    }

    // TODO: need notion of injecting custom types, what about duplicates
    toGraphQL() {
        return this._formatGql('GeoJSON', 'scalar GeoJSON');
    }

    toXlucene() {
        return { [this.field]: FieldType.GeoJSON };
    }
}

import { FieldType } from 'xlucene-evaluator';
import BaseType from '../base-type';
import { ElasticSearchTypes } from '../../../interfaces';

export default class GeoPointType extends BaseType {
    toESMapping(_version?: number) {
        return { mapping: { [this.field]: { type: 'geo_point' as ElasticSearchTypes } } };
    }

    toGraphQL(_typeName?: string, isInput?: boolean) {
        const defType = isInput ? 'input' : 'type';
        const name = this._formatGQLTypeName('GeoPoint', isInput);
        const customType = `
            ${defType} ${name} {
                lat: String!
                lon: String!
            }
        `;
        return this._formatGql(name, customType);
    }

    toXlucene() {
        return { [this.field]: FieldType.GeoPoint };
    }
}

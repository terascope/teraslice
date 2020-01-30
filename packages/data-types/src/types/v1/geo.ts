import { FieldType } from 'xlucene-evaluator';
import BaseType, { ToGraphQLOptions } from '../base-type';
import { ElasticSearchTypes } from '../../interfaces';

// TODO: This type is deprecated, not sure how to properly indicate it.
export default class GeoType extends BaseType {
    toESMapping(_version?: number) {
        return { mapping: { [this.field]: { type: 'geo_point' as ElasticSearchTypes } } };
    }

    toGraphQL({ isInput }: ToGraphQLOptions = {}) {
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
        return { [this.field]: FieldType.Geo };
    }
}

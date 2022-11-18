import 'jest-extended';
import { DataTypeFieldConfig, FieldType } from '@terascope/types';
import GeoPointType from '../../../src/types/v1/geo-point';

describe('GeoPoint V1', () => {
    const field = 'someField';
    const typeConfig: DataTypeFieldConfig = { type: FieldType.GeoPoint };

    it('can requires a field and proper configs', () => {
        const type = new GeoPointType(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new GeoPointType(field, typeConfig).toESMapping();
        const results = { mapping: { [field]: { type: 'geo_point' } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphql types', () => {
        const {
            type: graphQlTypes,
            customTypes
        } = new GeoPointType(field, typeConfig).toGraphQL();
        const results = `${field}: DTGeoPointV1`;
        const [customType] = customTypes;

        expect(graphQlTypes).toEqual(results);
        expect(customType).toInclude('type DTGeoPointV1 {');
        expect(customType).toInclude('lat: String!');
        expect(customType).toInclude('lon: String!');
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new GeoPointType(field, typeConfig).toXlucene();
        const results = { [field]: 'geo-point' };

        expect(xlucene).toEqual(results);
    });
});

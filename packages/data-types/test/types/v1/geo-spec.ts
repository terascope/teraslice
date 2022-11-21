import 'jest-extended';
import { DataTypeFieldConfig, FieldType } from '@terascope/types';
import GeoType from '../../../src/types/v1/geo';

describe('Geo V1 (deprecated)', () => {
    const field = 'someField';
    const typeConfig: DataTypeFieldConfig = { type: FieldType.Geo };

    it('can requires a field and proper configs', () => {
        const type = new GeoType(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new GeoType(field, typeConfig).toESMapping();
        const results = { mapping: { [field]: { type: 'geo_point' } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphql types', () => {
        const {
            type: graphQlTypes,
            customTypes
        } = new GeoType(field, typeConfig).toGraphQL();
        const results = `${field}: DTGeoPointV1`;
        const [customType] = customTypes;
        expect(graphQlTypes).toEqual(results);
        expect(customType).toInclude('type DTGeoPointV1 {');
        expect(customType).toInclude('lat: String!');
        expect(customType).toInclude('lon: String!');
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new GeoType(field, typeConfig).toXlucene();
        const results = { [field]: 'geo' };

        expect(xlucene).toEqual(results);
    });
});

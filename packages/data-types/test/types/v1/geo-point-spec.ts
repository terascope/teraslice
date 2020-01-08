import { TSError } from '@terascope/utils';
import GeoPointType from '../../../src/types/versions/v1/geo-point';
import { FieldTypeConfig } from '../../../src/interfaces';

describe('GeoPoint V1', () => {
    const field = 'someField';
    const typeConfig: FieldTypeConfig = { type: 'GeoPoint' };

    it('can requires a field and proper configs', () => {
        try {
            // @ts-ignore
            new GeoPointType();
            throw new Error('it should have errored with no configs');
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('A field must be provided and must be of type string');
        }

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
            custom_type: customType
        } = new GeoPointType(field, typeConfig).toGraphQL();
        const results = `${field}: DTGeoPointV1`;

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

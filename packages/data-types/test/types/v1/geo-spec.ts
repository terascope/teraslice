import { TSError } from '@terascope/utils';
import GeoType from '../../../src/types/versions/v1/geo';
import { FieldTypeConfig } from '../../../src/interfaces';

describe('Geo V1', () => {
    const field = 'someField';
    const typeConfig: FieldTypeConfig = { type: 'Geo' };

    it('can requires a field and proper configs', () => {
        try {
            // @ts-ignore
            new GeoType();
            throw new Error('it should have errored with no configs');
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('A field must be provided and must be of type string');
        }

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
        const results = `${field}: DTGeoPointTypeV1`;
        const [customType] = customTypes;
        expect(graphQlTypes).toEqual(results);
        expect(customType).toInclude('type DTGeoPointTypeV1 {');
        expect(customType).toInclude('lat: String!');
        expect(customType).toInclude('lon: String!');
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new GeoType(field, typeConfig).toXlucene();
        const results = { [field]: 'geo' };

        expect(xlucene).toEqual(results);
    });
});

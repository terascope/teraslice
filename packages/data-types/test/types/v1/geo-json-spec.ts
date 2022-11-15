import { DataTypeFieldConfig, FieldType } from '@terascope/types';
import GeoJSONType from '../../../src/types/v1/geo-json.js';

describe('GeoJSON V1', () => {
    const field = 'someField';
    const typeConfig: DataTypeFieldConfig = { type: FieldType.GeoJSON };

    it('can requires a field and proper configs', () => {
        const type = new GeoJSONType(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new GeoJSONType(field, typeConfig).toESMapping();
        const results = {
            mapping: {
                [field]: {
                    type: 'geo_shape',
                    tree: 'quadtree',
                    strategy: 'recursive'
                }
            }
        };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphql types', () => {
        const { type: graphQlTypes } = new GeoJSONType(field, typeConfig).toGraphQL();
        const results = `${field}: GeoJSON`;

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new GeoJSONType(field, typeConfig).toXlucene();
        const results = { [field]: 'geo-json' };

        expect(xlucene).toEqual(results);
    });
});

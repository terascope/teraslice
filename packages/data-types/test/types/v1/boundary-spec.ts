import 'jest-extended';
import { ESFieldType, DataTypeFieldConfig, FieldType } from '@terascope/types';
import Boundary from '../../../src/types/v1/boundary.js';

describe('Boundary V1', () => {
    const field = 'someField';
    const typeConfig: DataTypeFieldConfig = { type: FieldType.Boundary };

    it('can requires a field and proper configs', () => {
        const type = new Boundary(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new Boundary(field, typeConfig).toESMapping();
        const results = {
            mapping: {
                [field]: {
                    properties: {
                        lat: { type: 'float' as ESFieldType },
                        lon: { type: 'float' as ESFieldType },
                    },
                },
            },
        };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphql types', () => {
        const {
            type: graphQlTypes,
            customTypes
        } = new Boundary(field, typeConfig).toGraphQL();
        const results = `${field}: [DTGeoBoundaryV1]`;
        const [customType] = customTypes;

        expect(graphQlTypes).toEqual(results);
        expect(customType).toInclude('type DTGeoBoundaryV1 {');
        expect(customType).toInclude('lat: Float!');
        expect(customType).toInclude('lon: Float!');
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new Boundary(field, typeConfig).toXlucene();
        const results = { [field]: 'geo' };

        expect(xlucene).toEqual(results);
    });
});

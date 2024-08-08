import { DataTypeFieldConfig, FieldType } from '@terascope/types';
import ObjectType from '../../../src/types/v1/object.js';

describe('Object V1', () => {
    const field = 'someField';
    const typeConfig: DataTypeFieldConfig = { type: FieldType.Object };

    it('can requires a field and proper configs', () => {
        const type = new ObjectType(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new ObjectType(field, typeConfig).toESMapping();
        const results = { mapping: { [field]: { type: 'object' } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper ES Mappings if given an array', () => {
        const newTypeConfig = Object.assign({}, { array: true }, typeConfig);
        const esMapping = new ObjectType(field, newTypeConfig).toESMapping();
        const results = { mapping: { [field]: { type: 'nested' } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper ES Mappings when not indexed', () => {
        const esMapping = new ObjectType(field, {
            ...typeConfig,
            indexed: false,
        }).toESMapping();
        const results = { mapping: { [field]: { type: 'object', enabled: false } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphql types', () => {
        const graphQlTypes = new ObjectType(field, typeConfig).toGraphQL();
        const results = { type: `${field}: JSONObject`, customTypes: ['scalar JSONObject'] };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper graphql types when given an array', () => {
        const graphQlTypes = new ObjectType(field, { ...typeConfig, array: true }).toGraphQL();
        const results = { type: `${field}: [JSONObject]`, customTypes: ['scalar JSONObject'] };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new ObjectType(field, typeConfig).toXlucene();
        const results = { [field]: 'object' };

        expect(xlucene).toEqual(results);
    });
});

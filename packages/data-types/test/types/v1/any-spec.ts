import { DataTypeFieldConfig, FieldType } from '@terascope/types';
import AnyType from '../../../src/types/v1/any';

describe('Any V1', () => {
    const field = 'someField';
    const typeConfig: DataTypeFieldConfig = { type: FieldType.Any };

    it('can requires a field and proper configs', () => {
        const type = new AnyType(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new AnyType(field, typeConfig).toESMapping();
        const results = { mapping: { [field]: { enabled: false } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphql types', () => {
        const graphQlTypes = new AnyType(field, typeConfig).toGraphQL();
        const results = { type: `${field}: JSON`, customTypes: [] };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper graphql types when given an array', () => {
        const graphQlTypes = new AnyType(field, { ...typeConfig, array: true }).toGraphQL();
        const results = { type: `${field}: [JSON]`, customTypes: [] };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new AnyType(field, typeConfig).toXlucene();
        const results = {};

        expect(xlucene).toEqual(results);
    });
});

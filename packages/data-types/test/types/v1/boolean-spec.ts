import { DataTypeFieldConfig, FieldType } from '@terascope/types';
import BooleanType from '../../../src/types/v1/boolean';

describe('Boolean V1', () => {
    const field = 'someField';
    const typeConfig: DataTypeFieldConfig = { type: FieldType.Boolean };

    it('can requires a field and proper configs', () => {
        const type = new BooleanType(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new BooleanType(field, typeConfig).toESMapping();
        const results = { mapping: { [field]: { type: 'boolean' } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper ES Mappings if unindexed', () => {
        const esMapping = new BooleanType(field, { ...typeConfig, indexed: false }).toESMapping();
        const results = { mapping: { [field]: { type: 'boolean', index: false } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphql types', () => {
        const graphQlTypes = new BooleanType(field, typeConfig).toGraphQL();
        const results = { type: `${field}: Boolean`, customTypes: [] };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper graphql types when given an array', () => {
        const graphQlTypes = new BooleanType(field, { ...typeConfig, array: true }).toGraphQL();
        const results = { type: `${field}: [Boolean]`, customTypes: [] };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new BooleanType(field, typeConfig).toXlucene();
        const results = { [field]: 'boolean' };

        expect(xlucene).toEqual(results);
    });
});

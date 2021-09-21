import { DataTypeFieldConfig, FieldType } from '@terascope/types';
import Keyword from '../../../src/types/v1/keyword';

describe('Keyword V1', () => {
    const field = 'someField';
    const typeConfig: DataTypeFieldConfig = { type: FieldType.Keyword };

    it('can requires a field and proper configs', () => {
        const type = new Keyword(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new Keyword(field, typeConfig).toESMapping();
        const results = { mapping: { [field]: { type: 'keyword' } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper ES Mappings if unindexed', () => {
        const esMapping = new Keyword(field, { ...typeConfig, indexed: false }).toESMapping();
        const results = { mapping: { [field]: { type: 'keyword', index: false } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphql types', () => {
        const graphQlTypes = new Keyword(field, typeConfig).toGraphQL();
        const results = { type: `${field}: String`, customTypes: [] };

        expect(graphQlTypes).toEqual(results);
    });

    it('will use ID when the field is _key in graphql', () => {
        const graphQlTypes = new Keyword('_key', typeConfig).toGraphQL();

        expect(graphQlTypes).toEqual({ type: '_key: ID', customTypes: [] });
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new Keyword(field, typeConfig).toXlucene();
        const results = { [field]: 'string' };

        expect(xlucene).toEqual(results);
    });
});

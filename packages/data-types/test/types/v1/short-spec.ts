import { xLuceneFieldType } from '@terascope/types';
import Short from '../../../src/types/v1/short';
import { FieldTypeConfig } from '../../../src/interfaces';

describe('Short V1', () => {
    const field = 'someField';
    const typeConfig: FieldTypeConfig = { type: 'Short' };

    it('can requires a field and proper configs', () => {
        const type = new Short(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new Short(field, typeConfig).toESMapping();
        const results = { mapping: { [field]: { type: 'short' } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper ES Mappings if unindexed', () => {
        const esMapping = new Short(field, { ...typeConfig, indexed: false }).toESMapping();
        const results = { mapping: { [field]: { type: 'short', index: false } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphql types', () => {
        const graphQlTypes = new Short(field, typeConfig).toGraphQL();
        const results = { type: `${field}: Int`, customTypes: [] };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper graphql types when given an array', () => {
        const graphQlTypes = new Short(field, { ...typeConfig, array: true }).toGraphQL();
        const results = { type: `${field}: [Int]`, customTypes: [] };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new Short(field, typeConfig).toXlucene();
        const results = { [field]: xLuceneFieldType.Integer };

        expect(xlucene).toEqual(results);
    });
});

import { xLuceneFieldType, DataTypeFieldConfig, FieldType } from '@terascope/types';
import Integer from '../../../src/types/v1/integer.js';

describe('Integer V1', () => {
    const field = 'someField';
    const typeConfig: DataTypeFieldConfig = { type: FieldType.Integer };

    it('can requires a field and proper configs', () => {
        const type = new Integer(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new Integer(field, typeConfig).toESMapping();
        const results = { mapping: { [field]: { type: 'integer' } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphql types', () => {
        const graphQlTypes = new Integer(field, typeConfig).toGraphQL();
        const results = { type: `${field}: Int`, customTypes: [] };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new Integer(field, typeConfig).toXlucene();
        const results = { [field]: xLuceneFieldType.Integer };

        expect(xlucene).toEqual(results);
    });
});

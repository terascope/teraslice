import { DataTypeFieldConfig, FieldType } from '@terascope/types';
import FloatType from '../../../src/types/v1/float';

describe('Float V1', () => {
    const field = 'someField';
    const typeConfig: DataTypeFieldConfig = { type: FieldType.Float };

    it('can requires a field and proper configs', () => {
        const type = new FloatType(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new FloatType(field, typeConfig).toESMapping();
        const results = { mapping: { [field]: { type: 'float' } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphql types', () => {
        const graphQlTypes = new FloatType(field, typeConfig).toGraphQL();
        const results = { type: `${field}: Float`, customTypes: [] };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new FloatType(field, typeConfig).toXlucene();
        const results = { [field]: 'float' };

        expect(xlucene).toEqual(results);
    });
});

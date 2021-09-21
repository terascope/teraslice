import { xLuceneFieldType, DataTypeFieldConfig, FieldType } from '@terascope/types';
import DoubleType from '../../../src/types/v1/double';

describe('Double V1', () => {
    const field = 'someField';
    const typeConfig: DataTypeFieldConfig = { type: FieldType.Double };

    it('can requires a field and proper configs', () => {
        const type = new DoubleType(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new DoubleType(field, typeConfig).toESMapping();
        const results = { mapping: { [field]: { type: 'double' } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper ES Mappings if unindexed', () => {
        const esMapping = new DoubleType(field, { ...typeConfig, indexed: false }).toESMapping();
        const results = { mapping: { [field]: { type: 'double', index: false } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphql types', () => {
        const graphQlTypes = new DoubleType(field, typeConfig).toGraphQL();
        const results = { type: `${field}: Float`, customTypes: [] };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new DoubleType(field, typeConfig).toXlucene();
        const results = { [field]: xLuceneFieldType.Float };

        expect(xlucene).toEqual(results);
    });
});

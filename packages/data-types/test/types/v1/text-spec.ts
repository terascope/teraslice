import { DataTypeFieldConfig, FieldType } from '@terascope/types';
import Text from '../../../src/types/v1/text.js';

describe('Text V1', () => {
    const field = 'someField';
    const typeConfig: DataTypeFieldConfig = { type: FieldType.Text };

    it('can requires a field and proper configs', () => {
        const type = new Text(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new Text(field, typeConfig).toESMapping();
        const results = { mapping: { [field]: { type: 'text' } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphql types', () => {
        const graphQlTypes = new Text(field, typeConfig).toGraphQL();
        const results = { type: `${field}: String`, customTypes: [] };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper graphql types when given an array', () => {
        const graphQlTypes = new Text(field, { ...typeConfig, array: true }).toGraphQL();
        const results = { type: `${field}: [String]`, customTypes: [] };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new Text(field, typeConfig).toXlucene();
        const results = { [field]: 'string' };

        expect(xlucene).toEqual(results);
    });
});

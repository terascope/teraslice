import { DataTypeFieldConfig, FieldType } from '@terascope/types';
import IPType from '../../../src/types/v1/ip';

describe('IP V1', () => {
    const field = 'someField';
    const typeConfig: DataTypeFieldConfig = { type: FieldType.IP };

    it('can requires a field and proper configs', () => {
        const type = new IPType(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new IPType(field, typeConfig).toESMapping();
        const results = { mapping: { [field]: { type: 'ip' } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper ES Mappings if unindexed', () => {
        const esMapping = new IPType(field, { ...typeConfig, indexed: false }).toESMapping();
        const results = { mapping: { [field]: { type: 'ip', index: false } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphql types', () => {
        const graphQlTypes = new IPType(field, typeConfig).toGraphQL();
        const results = { type: `${field}: String`, customTypes: [] };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new IPType(field, typeConfig).toXlucene();
        const results = { [field]: 'ip' };

        expect(xlucene).toEqual(results);
    });
});

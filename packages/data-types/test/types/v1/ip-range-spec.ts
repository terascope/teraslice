import { DataTypeFieldConfig, FieldType } from '@terascope/types';
import IpRangeType from '../../../src/types/v1/ip-range.js';

describe('IPRange V1', () => {
    const field = 'someField';
    const typeConfig: DataTypeFieldConfig = { type: FieldType.IPRange };

    it('can requires a field and proper configs', () => {
        const type = new IpRangeType(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new IpRangeType(field, typeConfig).toESMapping();
        const results = { mapping: { [field]: { type: 'ip_range' } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphql types', () => {
        const graphQlTypes = new IpRangeType(field, typeConfig).toGraphQL();
        const results = { type: `${field}: String`, customTypes: [] };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new IpRangeType(field, typeConfig).toXlucene();
        const results = { [field]: 'ip_range' };

        expect(xlucene).toEqual(results);
    });
});

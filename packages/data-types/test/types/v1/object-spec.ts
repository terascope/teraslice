import ObejctType from '../../../src/types/v1/object';
import { FieldTypeConfig } from '../../../src/interfaces';

describe('Object V1', () => {
    const field = 'someField';
    const typeConfig: FieldTypeConfig = { type: 'Object' };

    it('can requires a field and proper configs', () => {
        const type = new ObejctType(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new ObejctType(field, typeConfig).toESMapping();
        const results = { mapping: { [field]: { type: 'object' } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper ES Mappings when not indexed', () => {
        const esMapping = new ObejctType(field, {
            ...typeConfig,
            indexed: false,
        }).toESMapping();
        const results = { mapping: { [field]: { type: 'object', enabled: false } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphql types', () => {
        const graphQlTypes = new ObejctType(field, typeConfig).toGraphQL();
        const results = { type: `${field}: JSONObject`, customTypes: ['scalar JSONObject'] };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper graphql types when given an array', () => {
        const graphQlTypes = new ObejctType(field, { ...typeConfig, array: true }).toGraphQL();
        const results = { type: `${field}: JSONObject`, customTypes: ['scalar JSONObject'] };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new ObejctType(field, typeConfig).toXlucene();
        const results = { [field]: 'object' };

        expect(xlucene).toEqual(results);
    });
});

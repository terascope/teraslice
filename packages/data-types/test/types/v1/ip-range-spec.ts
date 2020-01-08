import { TSError } from '@terascope/utils';
import IpRangeType from '../../../src/types/versions/v1/ip-range';
import { FieldTypeConfig } from '../../../src/interfaces';

describe('IPRange V1', () => {
    const field = 'someField';
    const typeConfig: FieldTypeConfig = { type: 'IPRange' };

    it('can requires a field and proper configs', () => {
        try {
            // @ts-ignore
            new IpRangeType();
            throw new Error('it should have errored with no configs');
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('A field must be provided and must be of type string');
        }

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
        const results = { [field]: 'ip' };

        expect(xlucene).toEqual(results);
    });
});

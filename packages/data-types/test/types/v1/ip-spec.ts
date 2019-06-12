import IpType from '../../../src/types/versions/v1/ip';
import { TSError } from '@terascope/utils';
import { TypeConfig } from '../../../src/interfaces';

describe('IP V1', () => {
    const field = 'someField';
    const typeConfig: TypeConfig = { type: 'IP' };

    it('can requires a field and proper configs', () => {
        try {
           // @ts-ignore
            new IpType();
            throw new Error('it should have errored with no configs');
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('A field must be provided and must be of type string');
        }

        const type = new IpType(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new IpType(field, typeConfig).toESMapping();
        const results = { mapping: { [field]: { type: 'ip' } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphQl types', () => {
        const graphQlTypes = new IpType(field, typeConfig).toGraphQL();
        const results = { type: `${field}: String` };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new IpType(field, typeConfig).toXlucene();
        const results = { [field]: 'ip' };

        expect(xlucene).toEqual(results);
    });
});

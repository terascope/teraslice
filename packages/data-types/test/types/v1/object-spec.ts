
import ObejctType from '../../../src/types/versions/v1/object';
import { Type } from '../../../src/interfaces';
import { TSError } from '@terascope/utils';

describe('Object V1', () => {
    const field = 'someField';
    const typeConfig: Type = { type: 'Object' };

    it('can requires a field and proper configs', () => {
        try {
           // @ts-ignore
            new ObejctType();
            throw new Error('it should have errored with no configs');
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('A field must be provided and must be of type string');
        }

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

    it('can get proper graphQl types', () => {
        const graphQlTypes = new ObejctType(field, typeConfig).toGraphQL();
        const results = { type: `${field}: JSON` };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new ObejctType(field, typeConfig).toXlucene();
        const results = { [field]: 'object' };

        expect(xlucene).toEqual(results);
    });
});

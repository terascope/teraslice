import HalfFloat from '../../../src/types/versions/v1/half-float';
import { TSError } from '@terascope/utils';

describe('Double V1', () => {
    const field = 'someField';
    const typeConfig = { type: 'half_float' };

    it('can requires a field and proper configs', () => {
        try {
           // @ts-ignore
            new HalfFloat();
            throw new Error('it should have errored with no configs');
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('A field must be provided and must be of type string');
        }

        const type = new HalfFloat(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQl).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new HalfFloat(field, typeConfig).toESMapping();
        const results = { mapping: { [field]: 'half_float' } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphQl types', () => {
        const graphQlTypes = new HalfFloat(field, typeConfig).toGraphQl();
        const results = { type: `${field}: Float` };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new HalfFloat(field, typeConfig).toXlucene();
        const results = { [field]: 'half_float' };

        expect(xlucene).toEqual(results);
    });
});

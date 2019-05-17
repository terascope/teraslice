
import DoubleType from '../../../src/types/versions/v1/double';
import { TSError } from '@terascope/utils';

describe('Double V1', () => {
    const field = 'someField';
    const typeConfig = { type: 'double' };

    it('can requires a field and proper configs', () => {
        try {
           // @ts-ignore
            new DoubleType();
            throw new Error('it should have errored with no configs');
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('A field must be provided and must be of type string');
        }

        const type = new DoubleType(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQl).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new DoubleType(field, typeConfig).toESMapping();
        const results = { mapping: { [field]: 'double' } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphQl types', () => {
        const graphQlTypes = new DoubleType(field, typeConfig).toGraphQl();
        const results = { type: `${field}: Int` };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new DoubleType(field, typeConfig).toXlucene();
        const results = { [field]: 'double' };

        expect(xlucene).toEqual(results);
    });
});

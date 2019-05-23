import LongType from '../../../src/types/versions/v1/long';
import { TSError } from '@terascope/utils';
import { TypeConfig } from '../../../src/interfaces';

describe('Long V1', () => {
    const field = 'someField';
    const typeConfig: TypeConfig = { type: 'Long' };

    it('can requires a field and proper configs', () => {
        try {
           // @ts-ignore
            new LongType();
            throw new Error('it should have errored with no configs');
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('A field must be provided and must be of type string');
        }

        const type = new LongType(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQl).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new LongType(field, typeConfig).toESMapping();
        const results = { mapping: { [field]: { type: 'long' } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphQl types', () => {
        const graphQlTypes = new LongType(field, typeConfig).toGraphQl();
        const results = { type: `${field}: Int` };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new LongType(field, typeConfig).toXlucene();
        const results = { [field]: 'long' };

        expect(xlucene).toEqual(results);
    });
});

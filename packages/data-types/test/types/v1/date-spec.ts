
import DateType from '../../../src/types/versions/v1/date';
import { TSError } from '@terascope/utils';
import { TypeConfig } from '../../../src/interfaces';

describe('Date V1', () => {
    const field = 'someField';
    const typeConfig: TypeConfig = { type: 'Date' };

    it('can requires a field and proper configs', () => {
        try {
           // @ts-ignore
            new DateType();
            throw new Error('it should have errored with no configs');
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('A field must be provided and must be of type string');
        }

        const type = new DateType(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new DateType(field, typeConfig).toESMapping();
        const results = { mapping: { [field]: { type: 'date' } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphQl types', () => {
        const graphQlTypes = new DateType(field, typeConfig).toGraphQL();
        const results = { type: `${field}: DateTime` };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new DateType(field, typeConfig).toXlucene();
        const results = { [field]: 'date' };

        expect(xlucene).toEqual(results);
    });
});

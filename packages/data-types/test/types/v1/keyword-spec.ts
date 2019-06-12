import Keyword from '../../../src/types/versions/v1/keyword';
import { TSError } from '@terascope/utils';
import { TypeConfig } from '../../../src/interfaces';

describe('Keyword V1', () => {
    const field = 'someField';
    const typeConfig: TypeConfig = { type: 'Keyword' };

    it('can requires a field and proper configs', () => {
        try {
           // @ts-ignore
            new Keyword();
            throw new Error('it should have errored with no configs');
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('A field must be provided and must be of type string');
        }

        const type = new Keyword(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new Keyword(field, typeConfig).toESMapping();
        const results = { mapping: { [field]: { type: 'keyword' } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphQl types', () => {
        const graphQlTypes = new Keyword(field, typeConfig).toGraphQL();
        const results = { type: `${field}: String` };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new Keyword(field, typeConfig).toXlucene();
        const results = { [field]: 'keyword' };

        expect(xlucene).toEqual(results);
    });
});

import Interger from '../../../src/types/versions/v1/integer';
import { TSError } from '@terascope/utils';
import { TypeConfig } from '../../../src/interfaces';

describe('Integer V1', () => {
    const field = 'someField';
    const typeConfig: TypeConfig = { type: 'Integer' };

    it('can requires a field and proper configs', () => {
        try {
           // @ts-ignore
            new Interger();
            throw new Error('it should have errored with no configs');
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('A field must be provided and must be of type string');
        }

        const type = new Interger(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new Interger(field, typeConfig).toESMapping();
        const results = { mapping: { [field]: { type: 'integer' } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphQl types', () => {
        const graphQlTypes = new Interger(field, typeConfig).toGraphQL();
        const results = { type: `${field}: Int` };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new Interger(field, typeConfig).toXlucene();
        const results = { [field]: 'integer' };

        expect(xlucene).toEqual(results);
    });
});

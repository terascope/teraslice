
import Short from '../../../src/types/versions/v1/short';
import { TSError } from '@terascope/utils';
import { Type } from '../../../src/interfaces';

describe('Short V1', () => {
    const field = 'someField';
    const typeConfig: Type = { type: 'Short' };

    it('can requires a field and proper configs', () => {
        try {
           // @ts-ignore
            new Short();
            throw new Error('it should have errored with no configs');
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('A field must be provided and must be of type string');
        }

        const type = new Short(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new Short(field, typeConfig).toESMapping();
        const results = { mapping: { [field]: { type: 'short' } } };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphQl types', () => {
        const graphQlTypes = new Short(field, typeConfig).toGraphQL();
        const results = { type: `${field}: Int` };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new Short(field, typeConfig).toXlucene();
        const results = { [field]: 'number' };

        expect(xlucene).toEqual(results);
    });
});

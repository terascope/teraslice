import { TSError } from '@terascope/utils';
import Keyword from '../../../src/types/v1/keyword';
import { FieldTypeConfig } from '../../../src/interfaces';

describe('Keyword V1', () => {
    const field = 'someField';
    const typeConfig: FieldTypeConfig = { type: 'Keyword' };

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

    it('can get proper graphql types', () => {
        const graphQlTypes = new Keyword(field, typeConfig).toGraphQL();
        const results = { type: `${field}: String`, customTypes: [] };

        expect(graphQlTypes).toEqual(results);
    });

    it('will use ID when the field is _key in graphql', () => {
        const graphQlTypes = new Keyword('_key', typeConfig).toGraphQL();

        expect(graphQlTypes).toEqual({ type: '_key: ID', customTypes: [] });
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new Keyword(field, typeConfig).toXlucene();
        const results = { [field]: 'string' };

        expect(xlucene).toEqual(results);
    });
});

import KeywordTokens from '../../../src/types/versions/v1/keyword-tokens';
import { TSError } from '@terascope/utils';
import { Type, ElasticSearchTypes } from '../../../src/interfaces';

describe('KeywordTokens V1', () => {
    const field = 'someField';
    const typeConfig: Type = { type: 'KeywordTokens' };

    it('can requires a field and proper configs', () => {
        try {
           // @ts-ignore
            new KeywordTokens();
            throw new Error('it should have errored with no configs');
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('A field must be provided and must be of type string');
        }

        const type = new KeywordTokens(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new KeywordTokens(field, typeConfig).toESMapping();
        const results = {
            mapping: {
                [field]: {
                    type: 'keyword' as ElasticSearchTypes,
                    fields: {
                        tokens: {
                            type: 'text',
                            index: 'true',
                            analyzer: 'simple'
                        }
                    }
                }
            }
        };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphQl types', () => {
        const graphQlTypes = new KeywordTokens(field, typeConfig).toGraphQL();
        const results = { type: `${field}: String` };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new KeywordTokens(field, typeConfig).toXlucene();
        const results = { [field]: 'string' };

        expect(xlucene).toEqual(results);
    });
});

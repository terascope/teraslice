import { TSError } from '@terascope/utils';
import KeywordTokensCaseInsensitive from '../../../src/types/versions/v1/keyword-tokens-case-insensitive';
import { FieldTypeConfig, ElasticSearchTypes } from '../../../src/interfaces';

describe('KeywordTokensCaseInsensitive V1', () => {
    const field = 'someField';
    const typeConfig: FieldTypeConfig = { type: 'KeywordTokensCaseInsensitive' };

    it('can requires a field and proper configs', () => {
        try {
            // @ts-ignore
            new KeywordTokensCaseInsensitive();
            throw new Error('it should have errored with no configs');
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('A field must be provided and must be of type string');
        }

        const type = new KeywordTokensCaseInsensitive(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new KeywordTokensCaseInsensitive(field, typeConfig).toESMapping();
        const results = {
            mapping: {
                [field]: {
                    // TODO: this is wrong, I dont think analyzer can be at this level
                    type: 'text' as ElasticSearchTypes,
                    analyzer: 'lowercase_keyword_analyzer',
                    fields: {
                        tokens: {
                            type: 'text' as ElasticSearchTypes,
                            analyzer: 'standard',
                        },
                    },
                },
            },
            analyzer: {
                lowercase_keyword_analyzer: {
                    tokenizer: 'keyword',
                    filter: 'lowercase',
                },
            },
        };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphql types', () => {
        const graphQlTypes = new KeywordTokensCaseInsensitive(field, typeConfig).toGraphQL();
        const results = { type: `${field}: String`, customTypes: [] };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new KeywordTokensCaseInsensitive(field, typeConfig).toXlucene();
        const results = { [field]: 'string' };

        expect(xlucene).toEqual(results);
    });
});

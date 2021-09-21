import { ESFieldType, DataTypeFieldConfig, FieldType } from '@terascope/types';
import NgramTokens from '../../../src/types/v1/ngram-tokens';

describe('NgramTokens V1', () => {
    const field = 'someField';
    const typeConfig: DataTypeFieldConfig = { type: FieldType.NgramTokens };

    it('can requires a field and proper configs', () => {
        const type = new NgramTokens(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new NgramTokens(field, typeConfig).toESMapping();
        const results = {
            mapping: {
                [field]: {
                    type: 'keyword' as ESFieldType,
                    fields: {
                        tokens: {
                            type: 'text' as ESFieldType,
                            analyzer: 'ngram_analyzer',
                        },
                    },
                },
            },
            analyzer: {
                ngram_analyzer: {
                    tokenizer: 'ngram_tokenizer',
                },
            },
            tokenizer: {
                ngram_tokenizer: {
                    type: 'ngram',
                    min_gram: 3,
                    max_gram: 3,
                    token_chars: ['digit'],
                },
            },
        };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphql types', () => {
        const graphQlTypes = new NgramTokens(field, typeConfig).toGraphQL();
        const results = { type: `${field}: String`, customTypes: [] };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new NgramTokens(field, typeConfig).toXlucene();
        const results = { [field]: 'string' };

        expect(xlucene).toEqual(results);
    });
});

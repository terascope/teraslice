import NgramTokens from '../../../src/types/versions/v1/ngram-tokens';
import { TSError } from '@terascope/utils';
import { Type, ElasticSearchTypes } from '../../../src/interfaces';

describe('NgramTokens V1', () => {
    const field = 'someField';
    const typeConfig: Type = { type: 'NgramTokens' };

    it('can requires a field and proper configs', () => {
        try {
           // @ts-ignore
            new NgramTokens();
            throw new Error('it should have errored with no configs');
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('A field must be provided and must be of type string');
        }

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
                    // TODO: this is wrong, I dont think analyzer can be at this level
                    type: 'keyword' as ElasticSearchTypes,
                    fields: {
                        tokens: {
                            type: 'text' as ElasticSearchTypes,
                            analyzer: 'ngram_analyzer'
                        }
                    }
                }
            },
            analyzer: {
                ngram_analyzer: {
                    tokenizer: 'ngram_tokenizer'
                }
            },
            tokenizer: {
                ngram_tokenizer: {
                    type: 'ngram',
                    min_gram: 3,
                    max_gram: 3,
                    token_chars: [
                        'digit'
                    ]
                }
            }
        };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphQl types', () => {
        const graphQlTypes = new NgramTokens(field, typeConfig).toGraphQL();
        const results = { type: `${field}: String` };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new NgramTokens(field, typeConfig).toXlucene();
        const results = { [field]: 'string' };

        expect(xlucene).toEqual(results);
    });
});

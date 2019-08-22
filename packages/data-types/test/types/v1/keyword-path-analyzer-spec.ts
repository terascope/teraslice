import KeywordPathAnalyzer from '../../../src/types/versions/v1/keyword-path-analyzer';
import { TSError } from '@terascope/utils';
import { FieldTypeConfig, ElasticSearchTypes } from '../../../src/interfaces';

describe('KeywordPathAnalyzer V1', () => {
    const field = 'someField';
    const typeConfig: FieldTypeConfig = { type: 'KeywordPathAnalyzer' };

    it('can requires a field and proper configs', () => {
        try {
            // @ts-ignore
            new KeywordPathAnalyzer();
            throw new Error('it should have errored with no configs');
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('A field must be provided and must be of type string');
        }

        const type = new KeywordPathAnalyzer(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new KeywordPathAnalyzer(field, typeConfig).toESMapping();
        const results = {
            mapping: {
                [field]: {
                    type: 'keyword' as ElasticSearchTypes,
                    fields: {
                        tokens: {
                            type: 'text',
                            analyzer: 'path_analyzer',
                        },
                    },
                },
            },
            analyzer: {
                path_analyzer: {
                    type: 'custom',
                    tokenizer: 'path_tokenizer'
                }
            },
            tokenizer: {
                path_tokenizer: {
                    type: 'pattern',
                    pattern: '\/'
                }
            },
        };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphQl types', () => {
        const graphQlTypes = new KeywordPathAnalyzer(field, typeConfig).toGraphQL();
        const results = { type: `${field}: String` };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new KeywordPathAnalyzer(field, typeConfig).toXlucene();
        const results = { [field]: 'string' };

        expect(xlucene).toEqual(results);
    });
});

import { ESFieldType, DataTypeFieldConfig, FieldType } from '@terascope/types';
import KeywordPathAnalyzer from '../../../src/types/v1/keyword-path-analyzer.js';

describe('KeywordPathAnalyzer V1', () => {
    const field = 'someField';
    const typeConfig: DataTypeFieldConfig = { type: FieldType.KeywordPathAnalyzer };

    it('can requires a field and proper configs', () => {
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
                    type: 'keyword' as ESFieldType,
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
                    pattern: '/'
                }
            },
        };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphql types', () => {
        const graphQlTypes = new KeywordPathAnalyzer(field, typeConfig).toGraphQL();
        const results = { type: `${field}: String`, customTypes: [] };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new KeywordPathAnalyzer(field, typeConfig).toXlucene();
        const results = { [field]: 'string' };

        expect(xlucene).toEqual(results);
    });
});

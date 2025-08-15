import { ESFieldType, DataTypeFieldConfig, FieldType } from '@terascope/types';
import KeywordCaseInsensitive from '../../../src/types/v1/keyword-case-insensitive.js';

describe('KeywordCaseInsensitive V1', () => {
    const field = 'someField';
    const typeConfig: DataTypeFieldConfig = { type: FieldType.KeywordCaseInsensitive };

    it('can requires a field and proper configs', () => {
        const type = new KeywordCaseInsensitive(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new KeywordCaseInsensitive(field, typeConfig).toESMapping();
        const results = {
            mapping: {
                [field]: {
                    type: 'text' as ESFieldType,
                    analyzer: 'lowercase_keyword_analyzer',
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

    it('should be indexed to create ES Mappings', () => {
        const domain = new KeywordCaseInsensitive(field, { ...typeConfig, indexed: false });
        expect(() => domain.toESMapping()).toThrow('KeywordCaseInsensitive is required to be indexed');
    });

    it('can get proper ES Mappings with a fields hack', () => {
        const esMapping = new KeywordCaseInsensitive(field, {
            ...typeConfig,
            use_fields_hack: true
        }).toESMapping();

        const results = {
            mapping: {
                [field]: {
                    type: 'keyword',
                    fields: {
                        text: {
                            type: 'text' as ESFieldType,
                            analyzer: 'lowercase_keyword_analyzer',
                        }
                    }
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
        const graphQlTypes = new KeywordCaseInsensitive(field, typeConfig).toGraphQL();
        const results = { type: `${field}: String`, customTypes: [] };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new KeywordCaseInsensitive(field, typeConfig).toXlucene();
        const results = { [field]: '~string' };

        expect(xlucene).toEqual(results);
    });

    it('can get proper xlucene properties with fields hack', () => {
        const xlucene = new KeywordCaseInsensitive(field, {
            ...typeConfig,
            use_fields_hack: true
        }).toXlucene();
        const results = { [field]: 'string' };

        expect(xlucene).toEqual(results);
    });
});

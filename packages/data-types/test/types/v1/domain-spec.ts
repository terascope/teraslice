import { ESFieldType, DataTypeFieldConfig, FieldType } from '@terascope/types';
import Domain from '../../../src/types/v1/domain.js';

describe('Domain V1', () => {
    const field = 'someField';
    const typeConfig: DataTypeFieldConfig = { type: FieldType.Domain };

    it('can requires a field and proper configs', () => {
        const type = new Domain(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new Domain(field, typeConfig).toESMapping();
        const results = {
            mapping: {
                [field]: {
                    type: 'text' as ESFieldType,
                    analyzer: 'lowercase_keyword_analyzer',
                    fields: {
                        tokens: {
                            type: 'text' as ESFieldType,
                            analyzer: 'standard',
                        },
                        right: {
                            type: 'text' as ESFieldType,
                            analyzer: 'domain_analyzer',
                            search_analyzer: 'lowercase_keyword_analyzer',
                        },
                    },
                },
            },
            analyzer: {
                lowercase_keyword_analyzer: {
                    tokenizer: 'keyword',
                    filter: 'lowercase',
                },
                domain_analyzer: {
                    filter: 'lowercase',
                    type: 'custom',
                    tokenizer: 'domain_tokens',
                },
            },
            tokenizer: {
                domain_tokens: {
                    reverse: 'true',
                    type: 'path_hierarchy',
                    delimiter: '.',
                },
            },
        };

        expect(esMapping).toEqual(results);
    });

    it('should be indexed to create ES Mappings', () => {
        const domain = new Domain(field, { ...typeConfig, indexed: false });
        expect(() => domain.toESMapping()).toThrow('Domain is required to be indexed');
    });

    it('can get proper graphql types', () => {
        const graphQlTypes = new Domain(field, typeConfig).toGraphQL();
        const results = { type: `${field}: String`, customTypes: [] };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new Domain(field, typeConfig).toXlucene();
        const results = { [field]: '~string' };

        expect(xlucene).toEqual(results);
    });
});

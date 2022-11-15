import { ESFieldType, DataTypeFieldConfig, FieldType } from '@terascope/types';
import KeywordTokens from '../../../src/types/v1/keyword-tokens.js';

describe('KeywordTokens V1', () => {
    const field = 'someField';
    const typeConfig: DataTypeFieldConfig = { type: FieldType.KeywordTokens };

    it('can requires a field and proper configs', () => {
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
                    type: 'keyword' as ESFieldType,
                    fields: {
                        tokens: {
                            type: 'text',
                            analyzer: 'standard',
                        },
                    },
                },
            },
        };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphql types', () => {
        const graphQlTypes = new KeywordTokens(field, typeConfig).toGraphQL();
        const results = { type: `${field}: String`, customTypes: [] };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new KeywordTokens(field, typeConfig).toXlucene();
        const results = { [field]: 'string' };

        expect(xlucene).toEqual(results);
    });
});

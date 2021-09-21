import { ESFieldType, DataTypeFieldConfig, FieldType } from '@terascope/types';
import Hostname from '../../../src/types/v1/hostname';

describe('Hostname V1', () => {
    const field = 'someField';
    const typeConfig: DataTypeFieldConfig = { type: FieldType.Hostname };

    it('can requires a field and proper configs', () => {
        const type = new Hostname(field, typeConfig);
        expect(type).toBeDefined();
        expect(type.toESMapping).toBeDefined();
        expect(type.toGraphQL).toBeDefined();
        expect(type.toXlucene).toBeDefined();
    });

    it('can get proper ES Mappings', () => {
        const esMapping = new Hostname(field, typeConfig).toESMapping();
        const results = {
            mapping: {
                [field]: {
                    type: 'text' as ESFieldType,
                    analyzer: 'lowercase_keyword_analyzer',
                    fields: {
                        tokens: {
                            type: 'text' as ESFieldType,
                            analyzer: 'hostname_analyzer',
                        },
                    },
                },
            },
            analyzer: {
                hostname_analyzer: {
                    type: 'custom',
                    tokenizer: 'hostname_tokenizer'
                },
                lowercase_keyword_analyzer: {
                    tokenizer: 'keyword',
                    filter: 'lowercase',
                }
            },
            tokenizer: {
                hostname_tokenizer: {
                    type: 'pattern',
                    pattern: '\\.'
                }
            },
        };

        expect(esMapping).toEqual(results);
    });

    it('can get proper graphql types', () => {
        const graphQlTypes = new Hostname(field, typeConfig).toGraphQL();
        const results = { type: `${field}: String`, customTypes: [] };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new Hostname(field, typeConfig).toXlucene();
        const results = { [field]: 'string' };

        expect(xlucene).toEqual(results);
    });
});

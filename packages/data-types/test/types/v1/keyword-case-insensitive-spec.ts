import { TSError } from '@terascope/utils';
import { ESFieldType } from '@terascope/types';
import KeywordCaseInsensitive from '../../../src/types/v1/keyword-case-insensitive';
import { FieldTypeConfig } from '../../../src/interfaces';

describe('KeywordCaseInsensitive V1', () => {
    const field = 'someField';
    const typeConfig: FieldTypeConfig = { type: 'KeywordCaseInsensitive' };

    it('can requires a field and proper configs', () => {
        try {
            // @ts-ignore
            new KeywordCaseInsensitive();
            throw new Error('it should have errored with no configs');
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('A field must be provided and must be of type string');
        }

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
                    // TODO: this is wrong, I dont think analyzer can be at this level
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
        const results = { [field]: 'string' };

        expect(xlucene).toEqual(results);
    });
});

import Hostname from '../../../src/types/versions/v1/hostname';
import { TSError } from '@terascope/utils';
import { FieldTypeConfig, ElasticSearchTypes } from '../../../src/interfaces';

describe('Hostname V1', () => {
    const field = 'someField';
    const typeConfig: FieldTypeConfig = { type: 'Hostname' };

    it('can requires a field and proper configs', () => {
        try {
            // @ts-ignore
            new Hostname();
            throw new Error('it should have errored with no configs');
        } catch (err) {
            expect(err).toBeInstanceOf(TSError);
            expect(err.message).toInclude('A field must be provided and must be of type string');
        }

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
                    type: 'text' as ElasticSearchTypes,
                    analyzer: 'lowercase_keyword_analyzer',
                    fields: {
                        tokens: {
                            type: 'text' as ElasticSearchTypes,
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

    it('can get proper graphQl types', () => {
        const graphQlTypes = new Hostname(field, typeConfig).toGraphQL();
        const results = { type: `${field}: String` };

        expect(graphQlTypes).toEqual(results);
    });

    it('can get proper xlucene properties', () => {
        const xlucene = new Hostname(field, typeConfig).toXlucene();
        const results = { [field]: 'string' };

        expect(xlucene).toEqual(results);
    });
});

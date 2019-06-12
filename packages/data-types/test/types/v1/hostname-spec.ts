import Hostname from '../../../src/types/versions/v1/hostname';
import { TSError } from '@terascope/utils';
import { Type, ElasticSearchTypes } from '../../../src/interfaces';

describe('Hostname V1', () => {
    const field = 'someField';
    const typeConfig: Type = { type: 'Hostname' };

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
                            analyzer: 'standard'
                        },
                        right: {
                            type: 'text' as ElasticSearchTypes,
                            analyzer: 'domain_analyzer',
                            search_analyzer: 'lowercase_keyword_analyzer'
                        }
                    }
                }
            },
            analyzer: {
                lowercase_keyword_analyzer: {
                    tokenizer: 'keyword',
                    filter: 'lowercase'
                },
                domain_analyzer: {
                    filter : 'lowercase',
                    type : 'custom',
                    tokenizer : 'domain_tokens'
                }
            },
            tokenizer : {
                domain_tokens : {
                    reverse : 'true',
                    type : 'PathHierarchy',
                    delimiter : '.'
                }
            }
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

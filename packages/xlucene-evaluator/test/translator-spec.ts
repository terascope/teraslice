import 'jest-extended';
import get from 'lodash/get';
import { debugLogger, TSError } from '@terascope/utils';
import { buildAnyQuery } from '../src/translator/utils';
import { Translator, TypeConfig } from '../src';
import { AST } from '../src/parser';
import allTestCases from './cases/translator';

const logger = debugLogger('translator-spec');

describe('Translator', () => {
    it('should have a query property', () => {
        const query = 'foo:bar';
        const translator = new Translator(query);

        expect(translator).toHaveProperty('query', query);
    });

    it('should return undefined when given an invalid query', () => {
        const node: unknown = { type: 'idk', field: 'a', val: true };
        expect(buildAnyQuery(node as AST)).toBeUndefined();
    });

    it('should throw when missing field on term node', () => {
        const node: unknown = { type: 'term', term: 'hello' };
        expect(() => {
            buildAnyQuery(node as AST);
        }).toThrowWithMessage(TSError, 'Unexpected problem when translating xlucene query');
    });

    it('should have a types property', () => {
        const query = 'foo:bar';
        const types: TypeConfig = {
            location: 'geo',
        };

        const translator = new Translator(query, types);

        expect(translator).toHaveProperty('types', types);
    });

    for (const [key, testCases] of Object.entries(allTestCases)) {
        describe(`when testing ${key.replace('_', ' ')} queries`, () => {
            describe.each(testCases)('given query %s', (query, property, expected, types) => {
                it('should translate the query correctly', () => {
                    const translator = new Translator(query, types);
                    const result = translator.toElasticsearchDSL();

                    const actual = get(result, property);
                    logger.trace('test result', JSON.stringify({
                        query,
                        expected,
                        property,
                        actual,
                    }, null, 4));

                    if (!actual) {
                        expect(result).toHaveProperty(property);
                    } else {
                        expect(actual).toEqual(expected);
                    }
                });
            });
        });
    }

    describe('when given an empty string', () => {
        it('should translate it to an empty query', () => {
            const translator = new Translator('');
            const result = translator.toElasticsearchDSL();
            expect(result).toEqual({
                query: {
                    query_string: {
                        query: ''
                    }
                }
            });
        });
    });
});

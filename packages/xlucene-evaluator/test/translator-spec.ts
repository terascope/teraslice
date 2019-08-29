/* eslint-disable no-self-compare */
import 'jest-extended';
import { debugLogger, get, times } from '@terascope/utils';
import { translateQuery } from '../src/translator/utils';
import {
    Translator, TypeConfig, FieldType, Parser
} from '../src';
import allTestCases from './cases/translator';

const logger = debugLogger('translator-spec');

describe('Translator', () => {
    it('should have a query property', () => {
        const query = 'foo:bar';
        const translator = new Translator(query);

        expect(translator).toHaveProperty('query', query);
    });

    it('should return a empty filter query when given an invalid query', () => {
        const parser = new Parser('');
        // @ts-ignore
        parser.ast = { type: 'idk', field: 'a', val: true } as any;
        expect(translateQuery(parser, {
            logger,
            geo_sort_order: 'asc',
            geo_sort_unit: 'meters',
        })).toEqual({
            query: {
                constant_score: {
                    filter: []
                }
            }
        });
    });

    it('should have the typeConfig property', () => {
        const query = 'foo:bar';
        const typeConfig: TypeConfig = {
            location: FieldType.Geo,
        };

        const translator = new Translator(query, {
            type_config: typeConfig,
        });

        expect(translator).toHaveProperty('typeConfig', typeConfig);
    });

    it('should have the default geo sort properties', () => {
        const query = 'foo:bar';

        const translator = new Translator(query);

        expect(translator).toHaveProperty('_defaultGeoSortOrder', 'asc');
        expect(translator).toHaveProperty('_defaultGeoSortUnit', 'meters');
    });

    it('should have the geo sort properties', () => {
        const query = 'foo:bar';

        const translator = new Translator(query, {
            default_geo_field: 'test_loc',
            default_geo_sort_order: 'desc',
            default_geo_sort_unit: 'km'
        });

        expect(translator).toHaveProperty('_defaultGeoField', 'test_loc');
        expect(translator).toHaveProperty('_defaultGeoSortOrder', 'desc');
        expect(translator).toHaveProperty('_defaultGeoSortUnit', 'kilometers');
    });

    for (const [key, testCases] of Object.entries(allTestCases)) {
        describe(`when testing ${key.replace('_', ' ')} queries`, () => {
            describe.each(testCases)('given query %s', (query, property, expected, options, toESOptions) => {
                it('should translate the query correctly', () => {
                    const translator = new Translator(query, options);
                    const result = translator.toElasticsearchDSL(toESOptions);

                    const actual = property && property !== '.' ? get(result, property) : result;
                    logger.trace(
                        'test result',
                        JSON.stringify(
                            {
                                query,
                                expected,
                                property,
                                actual,
                            },
                            null,
                            2
                        )
                    );

                    if (!actual) {
                        expect(result).toHaveProperty(property);
                    } else {
                        expect(actual).toStrictEqual(expected);
                    }
                });
            });
        });
    }

    describe('when testing edge cases', () => {
        describe('given a gigantic query', () => {
            it('should be able to translate it', () => {
                const randomFloat = (n: number) => Math.random() * n;

                const randomInt = (n: number) => Math.round(randomFloat(n));

                const randomVal = (n: number): string => {
                    if (Math.random() < Math.random()) {
                        return `(${randomInt(n)} ${randomInt(n)} ${randomInt(n)})`;
                    }
                    if (Math.random() < Math.random()) {
                        return `[* TO ${randomInt(n)}}`;
                    }
                    if (Math.random() < Math.random()) {
                        return '/[a-z]+/';
                    }
                    if (Math.random() < Math.random()) {
                        return 'hi:the?e';
                    }
                    if (Math.random() < Math.random()) {
                        return `>=${randomInt(n)}`;
                    }
                    if (Math.random() < Math.random()) {
                        return `<${randomFloat(n)}`;
                    }
                    if (Math.random() < Math.random()) {
                        return '[2012-01-01 TO 2012-12-31]';
                    }
                    if (Math.random() < Math.random()) {
                        return `[* TO ${randomInt(n)}}`;
                    }
                    if (Math.random() < Math.random()) {
                        return `(_geo_point_:"${randomFloat(n)},${randomFloat(n)}" _geo_distance_:${randomInt(n)}m)`;
                    }
                    return '"some-random-string"';
                };

                const joinParts = (parts: string[]) => parts
                    .map((part, i, arr) => {
                        if (i + 1 === arr.length) return `${part}`;
                        if (i % 2 === 0) return `(${part}) OR`;
                        if (i % 5 === 0) return `${part} OR`;
                        if (i % 7 === 0) return `${part} AND NOT`;
                        return `(${part}) AND`;
                    })
                    .join(' ');

                const joinOR = (s: string[], n: number) => s.join(n % 10 === 0 ? ') OR (' : ' OR ');

                const partsA = times(10, (n) => joinOR(times(10, (i) => `example_a_${n}_${i}:${randomVal(n)}`), n));
                const partsB = times(10, (n) => joinOR(times(10, (i) => `example_b_${n}_${i}:${randomVal(n)}`), n));
                const partsC = times(10, (n) => joinOR(times(10, (i) => `example_c_${n}_${i}:${randomVal(n)}`), n));
                const query = joinParts([partsA, partsB, partsC].map(joinParts));

                const translator = new Translator(query);
                const result = translator.toElasticsearchDSL();
                expect(result).toMatchObject({
                    query: {
                        constant_score: {
                            filter: {
                                bool: {},
                            },
                        },
                    },
                });
            });
        });
    });

    describe('when given an empty string', () => {
        it('should translate it to an empty query', () => {
            const translator = new Translator('');
            const result = translator.toElasticsearchDSL();
            expect(result).toEqual({
                query: {
                    match_all: {},
                },
            });
        });
    });
});

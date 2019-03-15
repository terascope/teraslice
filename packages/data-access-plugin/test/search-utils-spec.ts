import 'jest-extended';
import { TSError, times, debugLogger } from '@terascope/utils';
import { SearchResponse, SearchParams, Client } from 'elasticsearch';
import * as utils from '../src/search/utils';
import { InputQuery } from '../src/search/interfaces';
import { DataAccessConfig, SpaceSearchConfig } from '@terascope/data-access';
import { TypeConfig } from 'xlucene-evaluator';

const logger = debugLogger('search-utils-spec');

describe('Search Utils', () => {
    describe('getSearchParams', () => {
        it('should throw an error if given an invalid size', () => {
            const query: InputQuery = {
                // @ts-ignore
                size: 'ugh' as number
            };
            const config: SpaceSearchConfig = {
                index: ''
            };

            expect(() => {
                utils.getSearchParams(query, config);
            }).toThrowWithMessage(TSError, 'Invalid size parameter, must be a valid number, was given: "ugh"');
        });

        it('should throw an error if given size too large', () => {
            const query: InputQuery = { size: 1000 };
            const config: SpaceSearchConfig = {
                index: '',
                max_query_size: 500
            };

            expect(() => {
                utils.getSearchParams(query, config);
            }).toThrowWithMessage(TSError, 'Invalid size parameter, must be less than 500, was given: "1000"');
        });

        it('should throw an error if given an invalid start', () => {
            const query: InputQuery = {
                // @ts-ignore
                start: 'bah' as number
            };
            const config: SpaceSearchConfig = {
                index: ''
            };

            expect(() => {
                utils.getSearchParams(query, config);
            }).toThrowWithMessage(TSError, 'Invalid start parameter, must be a valid number, was given: "bah"');
        });

        it('should throw an error if given an invalid query', () => {
            const query: InputQuery = {
                // @ts-ignore
                q: null as string
            };

            const config: SpaceSearchConfig = {
                index: '',
                require_query: true
            };

            expect(() => {
                utils.getSearchParams(query, config);
            }).toThrowWithMessage(TSError, 'Invalid q parameter, must not be empty, was given: ""');
        });

        it('should throw an error if given an invalid sort', () => {
            const query: InputQuery = {
                sort: 'example:ugh'
            };

            const config: SpaceSearchConfig = {
                index: '',
                sort_enabled: true
            };

            expect(() => {
                utils.getSearchParams(query, config);
            }).toThrowWithMessage(TSError, 'Invalid sort parameter, must be field_name:asc or field_name:desc, was given: "example:ugh"');
        });

        it('should throw an error if given an object as sort', () => {
            const query: InputQuery = {
                // @ts-ignore
                sort: { example: true }
            };

            const config: SpaceSearchConfig = {
                index: '',
                sort_enabled: true
            };

            expect(() => {
                utils.getSearchParams(query, config);
            }).toThrowWithMessage(TSError, 'Invalid sort parameter, must be a valid string, was given: "{"example":true}"');
        });

        it('should throw an error if given an invalid geo_sort_unit param', () => {
            const query: InputQuery = {
                geo_sort_point: '1,-1',
                geo_sort_order: 'asc',
                geo_sort_unit: 'uhoh'
            };

            const config: SpaceSearchConfig = {
                index: '',
                default_geo_field: 'hello'
            };

            expect(() => {
                utils.getSearchParams(query, config);
            }).toThrowWithMessage(TSError, 'Invalid geo_sort_unit parameter, must be one of "mi", "yd", "ft", "km" or "m", was given: "uhoh"');
        });

        it('should throw an error if given an invalid sort on date', () => {
            const query: InputQuery = {
                sort: 'WrongDate:asc'
            };

            const config: SpaceSearchConfig = {
                index: '',
                sort_enabled: true,
                default_date_field: 'somedate',
                sort_dates_only: true
            };

            const types = utils.getTypesConfig({
                // @ts-ignore
                data_type: {
                    typesConfig: {
                        otherdate: 'date'
                    }
                },
            }, config);

            expect(() => {
                utils.getSearchParams(query, config, types);
            }).toThrowWithMessage(TSError, 'Invalid sort parameter, sorting is currently only available for date fields, was given: "WrongDate:asc"');
        });

        it('should be able to handle minimal query options', () => {
            const query: InputQuery = {
                q: 'hello',
                sort: 'example:asc',
                start: 10,
            };

            const config: SpaceSearchConfig = {
                sort_default: 'default:asc',
                sort_enabled: true,
                index: 'woot'
            };

            const params = utils.getSearchParams(query, config);

            expect(params).toEqual({
                body: {},
                ignoreUnavailable: true,
                index: 'woot',
                q: 'hello',
                sort: 'example:asc',
                size: 100,
                from: 10
            });
        });

        it('should be able to handle complex query options', () => {
            const query: InputQuery = {
                q: 'example:hello',
                sort: 'created:desc',
                start: 0,
                size: 999,
                fields: 'one, tWo,Three ',
            };

            const config: SpaceSearchConfig = {
                sort_enabled: true,
                sort_dates_only: true,
                max_query_size: 1000,
                index: 'woot'
            };

            const types: TypeConfig = {
                created: 'date'
            };

            const params = utils.getSearchParams(query, config, types);

            expect(params).toEqual({
                body: {},
                ignoreUnavailable: true,
                index: 'woot',
                q: 'example:hello',
                sort: 'created:desc',
                size: 999,
                from: 0,
                _sourceInclude: ['one', 'two', 'three'],
            });
        });

        it('should be able to handle a geo point query and sort', () => {
            const query: InputQuery = {
                q: 'example:hello',
                geo_sort_point: '33.435518,-111.873616',
                geo_sort_order: 'desc',
                geo_sort_unit: 'm'
            };

            const config: SpaceSearchConfig = {
                default_geo_field: 'example_location',
                index: 'woot',
            };

            const types: TypeConfig = {
                created: 'date'
            };

            const params = utils.getSearchParams(query, config, types);

            expect(params).toEqual({
                body: {
                    sort: {
                        _geo_distance: {
                            example_location: {
                                lat: -111.873616,
                                lon: 33.435518
                            },
                            order: 'desc',
                            unit: 'm'
                        }
                    }
                },
                ignoreUnavailable: true,
                index: 'woot',
                q: 'example:hello',
                size: 100
            });
        });
    });

    describe('search', () => {
        it('should throw if no indexConfig is given', async () => {
            expect.hasAssertions();

            const client = fakeClient();
            // @ts-ignore
            const accessConfig: DataAccessConfig = {};

            try {
                await utils.makeSearchFn(client, accessConfig, logger);
            } catch (err) {
                expect(err.toString()).toEqual('TSError: Search is not configured correctly for search');
            }
        });

        it('should throw if no index is given', async () => {
            expect.hasAssertions();

            const client = fakeClient();
            const accessConfig: DataAccessConfig = {
                // @ts-ignore
                other: true
            };

            try {
                await utils.makeSearchFn(client, accessConfig, logger);
            } catch (err) {
                expect(err.toString()).toEqual('TSError: Search is not configured correctly for search');
            }
        });
    });

    describe('getSearchResponse', () => {
        it('should handle the error case', () => {
            expect(() => {
                // @ts-ignore
                utils.getSearchResponse({ error: 'Uh oh' });
            }).toThrowWithMessage(TSError, 'Uh oh');
        });

        it('should handle no results', () => {
            expect(() => {
                // @ts-ignore
                utils.getSearchResponse({ });
            }).toThrowWithMessage(TSError, 'No results returned from query');
        });

        it('should be able to return a valid result', () => {
            const total = 5;
            const input: unknown = {
                _shards: {
                    total: 2
                },
                hits: {
                    hits: times(total, (n) => ({
                        _index: 'example',
                        _source: {
                            example: n
                        }
                    })),
                    total,
                }
            };

            const config: SpaceSearchConfig = {
                index: 'example',
                sort_enabled: true
            };

            const query = {
                sort: 'example:asc'
            };

            const params: SearchParams = {
                size: 2
            };

            const result = utils.getSearchResponse(input as SearchResponse<any>, config, query, params);
            expect(result).toEqual({
                total,
                info: '5 results found. Returning 2.',
                returning: 2,
                results: times(total, (n) => ({
                    example: n
                }))
            });
        });

        it('should be able to return a valid result with the index name', () => {
            const total = 5;
            const input: unknown = {
                _shards: {
                    total: 1
                },
                hits: {
                    hits: times(total, (n) => ({
                        _index: 'example',
                        _source: {
                            example: n
                        }
                    })),
                    total,
                }
            };

            const config: SpaceSearchConfig = {
                index: 'example',
                preserve_index_name: true,
                sort_enabled: false
            };

            const query = {
                sort: 'example:asc'
            };

            const params: SearchParams = {
                size: 2
            };

            const result = utils.getSearchResponse(input as SearchResponse<any>, config, query, params);
            expect(result).toEqual({
                total,
                info: '5 results found. Returning 2. No sorting available.',
                returning: 2,
                results: times(total, (n) => ({
                    _index: 'example',
                    example: n
                }))
            });
        });
    });
});

function fakeClient(): Client {
    const client: unknown = {};
    return client as Client;
}

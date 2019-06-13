import 'jest-extended';
import * as ts from '@terascope/utils';
import { SearchParams, SearchResponse } from 'elasticsearch';
import { DataTypeConfig } from '@terascope/data-types';

import { SearchAccess, View, DataType, InputQuery, SpaceSearchConfig } from '../src';

describe('SearchAccess', () => {
    it('should fail if given an invalid search config', () => {
        expect(() => {
            // @ts-ignore
            new SearchAccess({
                // @ts-ignore
                config: {},
            });
        }).toThrowWithMessage(ts.TSError, 'Search is not configured correctly for search');
    });

    it('should be able to restrict the query for bar', () => {
        const searchAccess = makeWith();
        expect(() => {
            searchAccess.restrictSearchQuery('bar:foo');
        }).toThrowWithMessage(ts.TSError, 'Field bar in query is restricted');
    });

    it('should be able to return a restricted query', () => {
        const searchAccess = makeWith();
        const params: SearchParams = {
            q: 'idk',
            _sourceInclude: ['moo'],
            _sourceExclude: ['baz'],
        };

        const result = searchAccess.restrictSearchQuery('foo:bar', params);
        expect(result).toMatchObject({
            _sourceExclude: ['baz'],
            _sourceInclude: ['moo'],
        });

        expect(params).toHaveProperty('q', 'idk');
        expect(result).not.toHaveProperty('q', 'idk');
    });

    it('should be able to return a restricted query without any params', () => {
        const searchAccess = makeWith();

        const result = searchAccess.restrictSearchQuery('foo:bar');
        expect(result).toMatchObject({
            _sourceExclude: ['bar', 'baz'],
            _sourceInclude: ['foo', 'moo'],
        });

        expect(result).not.toHaveProperty('q', 'idk');
    });

    describe('when performing a search', () => {
        describe('getSearchParams', () => {
            it('should throw an error if given an invalid size', () => {
                const searchAccess = makeWith({});

                const query: InputQuery = {
                    // @ts-ignore
                    size: 'ugh' as number,
                };

                expect(() => {
                    searchAccess.getSearchParams(query);
                }).toThrowWithMessage(ts.TSError, 'Invalid size parameter, must be a valid number, was given: "ugh"');
            });

            it('should throw an error if given size too large', () => {
                const searchAccess = makeWith({
                    max_query_size: 500,
                });
                const query: InputQuery = { size: 1000 };

                expect(() => {
                    searchAccess.getSearchParams(query);
                }).toThrowWithMessage(ts.TSError, 'Invalid size parameter, must be less than 500, was given: "1000"');
            });

            it('should throw an error if given an invalid start', () => {
                const searchAccess = makeWith({});
                const query: InputQuery = {
                    // @ts-ignore
                    start: 'bah' as number,
                };

                expect(() => {
                    searchAccess.getSearchParams(query);
                }).toThrowWithMessage(ts.TSError, 'Invalid start parameter, must be a valid number, was given: "bah"');
            });

            it('should throw an error if given an invalid query', () => {
                const searchAccess = makeWith({
                    require_query: true,
                });
                const query: InputQuery = {
                    // @ts-ignore
                    q: null as string,
                };

                expect(() => {
                    searchAccess.getSearchParams(query);
                }).toThrowWithMessage(ts.TSError, 'Invalid q parameter, must not be empty, was given: ""');
            });

            it('should throw an error if given an invalid sort', () => {
                const searchAccess = makeWith({
                    sort_enabled: true,
                });

                const query: InputQuery = {
                    sort: 'example:ugh',
                };

                expect(() => {
                    searchAccess.getSearchParams(query);
                }).toThrowWithMessage(
                    ts.TSError,
                    'Invalid sort parameter, must be field_name:asc or field_name:desc, was given: "example:ugh"'
                );
            });

            it('should throw an error if given an object as sort', () => {
                const searchAccess = makeWith({
                    sort_enabled: true,
                });

                const query: InputQuery = {
                    // @ts-ignore
                    sort: { example: true },
                };

                expect(() => {
                    searchAccess.getSearchParams(query);
                }).toThrowWithMessage(ts.TSError, 'Invalid sort parameter, must be a valid string, was given: "{"example":true}"');
            });

            it('should throw an error if given an invalid geo_sort_unit param', () => {
                const searchAccess = makeWith({
                    default_geo_field: 'hello',
                });

                const query: InputQuery = {
                    geo_sort_point: '1,-1',
                    geo_sort_order: 'asc',
                    geo_sort_unit: 'uhoh',
                };

                expect(() => {
                    searchAccess.getSearchParams(query);
                }).toThrowWithMessage(
                    ts.TSError,
                    'Invalid geo_sort_unit parameter, must be one of "mi", "yd", "ft", "km" or "m", was given: "uhoh"'
                );
            });

            it('should throw an error if given an invalid sort on date', () => {
                const searchAccess = makeWith({
                    sort_enabled: true,
                    default_date_field: 'somedate',
                    sort_dates_only: true,
                });

                const query: InputQuery = {
                    sort: 'WrongDate:asc',
                };

                expect(() => {
                    searchAccess.getSearchParams(query);
                }).toThrowWithMessage(
                    ts.TSError,
                    'Invalid sort parameter, sorting is currently only available for date fields, was given: "WrongDate:asc"'
                );
            });

            it('should be able to handle minimal query options', () => {
                const searchAccess = makeWith({
                    sort_default: 'default:asc',
                    sort_enabled: true,
                    index: 'woot',
                });

                const query: InputQuery = {
                    q: 'hello',
                    sort: 'example:asc',
                    start: 10,
                };

                const params = searchAccess.getSearchParams(query);

                expect(params).toEqual({
                    body: {},
                    ignoreUnavailable: true,
                    index: 'woot',
                    q: 'hello',
                    sort: 'example:asc',
                    size: 100,
                    from: 10,
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

                const searchAccess = makeWith(
                    {
                        sort_enabled: true,
                        sort_dates_only: true,
                        max_query_size: 1000,
                        index: 'woot',
                    },
                    {
                        fields: { created: { type: 'Date' } },
                        version: 1,
                    }
                );

                const params = searchAccess.getSearchParams(query);

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
                    geo_sort_unit: 'm',
                };

                const searchAccess = makeWith(
                    {
                        default_geo_field: 'example_location',
                        index: 'woot',
                    },
                    {
                        fields: { created: { type: 'Date' } },
                        version: 1,
                    }
                );

                const params = searchAccess.getSearchParams(query);

                expect(params).toEqual({
                    body: {
                        sort: {
                            _geo_distance: {
                                example_location: {
                                    lon: -111.873616,
                                    lat: 33.435518,
                                },
                                order: 'desc',
                                unit: 'm',
                            },
                        },
                    },
                    ignoreUnavailable: true,
                    index: 'woot',
                    from: 0,
                    q: 'example:hello',
                    size: 100,
                });
            });
        });

        describe('getSearchResponse', () => {
            it('should handle the error case', () => {
                const searchAccess = makeWith();
                expect(() => {
                    // @ts-ignore
                    searchAccess.getSearchResponse({ error: 'Uh oh' });
                }).toThrowWithMessage(ts.TSError, 'Uh oh');
            });

            it('should handle no results', () => {
                const searchAccess = makeWith();
                expect(() => {
                    // @ts-ignore
                    searchAccess.getSearchResponse({});
                }).toThrowWithMessage(ts.TSError, 'No results returned from query');
            });

            it('should be able to return a valid result', () => {
                const total = 5;
                const input: unknown = {
                    _shards: {
                        total: 2,
                    },
                    hits: {
                        hits: ts.times(total, n => ({
                            _index: 'example',
                            _source: {
                                example: n,
                            },
                        })),
                        total,
                    },
                };

                const searchAccess = makeWith({
                    index: 'example',
                    sort_enabled: true,
                });

                const query = {
                    sort: 'example:asc',
                };

                const params: SearchParams = {
                    size: 2,
                };

                const result = searchAccess.getSearchResponse(input as SearchResponse<any>, query, params);
                expect(result).toEqual({
                    total,
                    info: '5 results found. Returning 2.',
                    returning: 2,
                    results: ts.times(total, n => ({
                        example: n,
                    })),
                });
            });

            it('should be able to return a valid result with the index name', () => {
                const total = 5;
                const input: unknown = {
                    _shards: {
                        total: 1,
                    },
                    hits: {
                        hits: ts.times(total, n => ({
                            _index: 'example',
                            _source: {
                                example: n,
                            },
                        })),
                        total,
                    },
                };

                const searchAccess = makeWith({
                    index: 'example',
                    preserve_index_name: true,
                    sort_enabled: false,
                });

                const query = {
                    sort: 'example:asc',
                };

                const params: SearchParams = {
                    size: 2,
                };

                const result = searchAccess.getSearchResponse(input as SearchResponse<any>, query, params);
                expect(result).toEqual({
                    total,
                    info: '5 results found. Returning 2. No sorting available.',
                    returning: 2,
                    results: ts.times(total, n => ({
                        _index: 'example',
                        example: n,
                    })),
                });
            });
        });
    });
});

function makeWith(searchConfig: Partial<SpaceSearchConfig> = {}, _typeConfig?: DataTypeConfig) {
    const typeConfig = _typeConfig || { fields: {}, version: 1 };
    const view: View = {
        client_id: 1,
        id: 'example-view',
        name: 'Example View',
        data_type: 'example-data-type',
        roles: ['example-role'],
        excludes: ['bar', 'baz'],
        includes: ['foo', 'moo'],
        updated: new Date().toISOString(),
        created: new Date().toISOString(),
    };

    const dataType: DataType = {
        client_id: 1,
        id: 'example-data-type',
        name: 'ExampleType',
        config: typeConfig,
        updated: new Date().toISOString(),
        created: new Date().toISOString(),
    };

    return new SearchAccess({
        view,
        type: 'SEARCH',
        data_type: dataType,
        space_endpoint: 'example-endpoint',
        config: Object.assign(
            {
                index: 'example-index',
            },
            searchConfig
        ),
        space_id: 'example-space',
        user_id: 'example-user',
        role_id: 'example-role',
    });
}

import 'jest-extended';
import { TSError, times } from '@terascope/utils';
import { SearchResponse } from 'elasticsearch';
import * as utils from '../src/search/utils';

describe('Search Utils', () => {
    describe('getSearchOptions', () => {
        it('should throw an error if given an invalid size', () => {
            const query = { size: 'ugh' };
            expect(() => {
                // @ts-ignore
                utils.getQueryConfig(query, { view: {} });
            }).toThrowWithMessage(TSError, 'Invalid size parameter, must be a valid number, was given: "ugh"');
        });

        it('should throw an error if given size too large', () => {
            const query = { size: 1000 };
            expect(() => {
                // @ts-ignore
                utils.getQueryConfig(query, {
                    view: {
                        max_query_size: 500
                    }
                });
            }).toThrowWithMessage(TSError, 'Invalid size parameter, must be less than 500, was given: "1000"');
        });

        it('should throw an error if given an invalid start', () => {
            const query = ({ start: 'bah' });
            expect(() => {
                // @ts-ignore
                utils.getQueryConfig(query, { view: {} });
            }).toThrowWithMessage(TSError, 'Invalid start parameter, must be a valid number, was given: "bah"');
        });

        it('should throw an error if given an invalid query', () => {
            const query = ({ q: null });
            expect(() => {
                // @ts-ignore
                utils.getQueryConfig(query, { view: { require_query: true } });
            }).toThrowWithMessage(TSError, 'Invalid q parameter, must not be empty, was given: ""');
        });

        it('should throw an error if given an invalid sort', () => {
            const query = ({ sort: 'example:ugh' });
            expect(() => {
                // @ts-ignore
                utils.getQueryConfig(query, { view: { sort_enabled: true } });
            }).toThrowWithMessage(TSError, 'Invalid sort parameter, must be field_name:asc or field_name:desc, was given: "example:ugh"');
        });

        it('should throw an error if given an object as sort', () => {
            const query = ({ sort: { example: true } });
            expect(() => {
                // @ts-ignore
                utils.getQueryConfig(query, { view: { sort_enabled: true } });
            }).toThrowWithMessage(TSError, 'Invalid sort parameter, must be a valid string, was given: "{"example":true}"');
        });

        it('should throw an error if given an invalid sort on date', () => {
            const query = ({ sort: 'wrongdate:asc' });
            expect(() => {
                // @ts-ignore
                utils.getQueryConfig(query, {
                    view: {
                        sort_enabled: true,
                        default_date_field: 'somedate',
                        sort_dates_only: true
                    }
                });
            }).toThrowWithMessage(TSError, 'Invalid sort parameter, sorting is currently only available for date fields, was given: "wrongdate:asc"');
        });

        it('should be able to return the options', () => {
            const query = ({ q: 'hello', sort: 'example:asc' });
            // @ts-ignore
            const result = utils.getQueryConfig(query, {
                view: {
                    sort_default: 'default:asc',
                    sort_enabled: true
                }
            });

            expect(result).toEqual({
                geoBoxTopLeft: undefined,
                geoDistance: undefined,
                geoPoint: undefined,
                geoSortOrder: 'asc',
                geoSortPoint: undefined,
                geoSortUnit: 'm',
                history: undefined,
                historyPrefix: undefined,
                historyStart: undefined,
                q: 'hello',
                sort: 'example:asc',
                size: 100,
                sortDisabled: false,
                start: undefined
            });
        });
    });

    describe('search', () => {
        it('should throw if no indexConfig is given', async () => {
            expect.hasAssertions();

            // @ts-ignore
            const search = utils.makeSearchFn({}, {}, {});
            try {
                await search({});
            } catch (err) {
                expect(err.toString()).toEqual('TSError: Search is not configured correctly');
            }
        });

        it('should throw if no index is given', async () => {
            expect.hasAssertions();

            // @ts-ignore
            const search = utils.makeSearchFn({}, { other: true }, {});
            try {
                await search({});
            } catch (err) {
                expect(err.toString()).toEqual('TSError: Search is not configured correctly');
            }
        });
    });

    describe('handleSearchResponse', () => {
        it('should handle the error case', () => {
            expect(() => {
                // @ts-ignore
                utils.handleSearchResponse({ error: 'Uh oh' });
            }).toThrowWithMessage(TSError, 'Uh oh');
        });

        it('should handle no results', () => {
            expect(() => {
                // @ts-ignore
                utils. handleSearchResponse({ });
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

            const config: utils.SearchConfig = {
                space: { index: 'example' },
                types: {},
                view: {},
                // @ts-ignore
                query: {
                    size: 2,
                    sortDisabled: true,
                }
            };

            const result = utils.handleSearchResponse(input as SearchResponse<any>, config);
            expect(result).toEqual({
                total,
                info: '5 results found. Returning 2. No sorting available.',
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

            const config: utils.SearchConfig = {
                space: { index: 'example' },
                types: {},
                view: {
                    preserve_index_name: true,
                },
                // @ts-ignore
                query: {
                    size: 2,
                    sortDisabled: true,
                }
            };

            const result = utils.handleSearchResponse(input as SearchResponse<any>, config);
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

import 'jest-extended';
import { Request } from 'express';
import { TSError, times } from '@terascope/utils';
import { SearchResponse } from 'elasticsearch';
import * as utils from '../src/search/utils';

describe('Search Utils', () => {
    describe('getSearchOptions', () => {
        it('should throw an error if given an invalid size', () => {
            const req = fakeReq({ size: 'ugh' });
            expect(() => {
                utils.getSearchOptions(req, {});
            }).toThrowWithMessage(TSError, 'Invalid size parameter, must be a valid number, was given: "ugh"');
        });

        it('should throw an error if given size too large', () => {
            const req = fakeReq({ size: 1000 });
            expect(() => {
                utils.getSearchOptions(req, { max_query_size: 500 });
            }).toThrowWithMessage(TSError, 'Invalid size parameter, must be less than 500, was given: "1000"');
        });

        it('should throw an error if given an invalid start', () => {
            const req = fakeReq({ start: 'bah' });
            expect(() => {
                utils.getSearchOptions(req, { });
            }).toThrowWithMessage(TSError, 'Invalid start parameter, must be a valid number, was given: "bah"');
        });

        it('should throw an error if given an invalid query', () => {
            const req = fakeReq({ q: null });
            expect(() => {
                utils.getSearchOptions(req, { require_query: true });
            }).toThrowWithMessage(TSError, 'Invalid q parameter, must not be empty, was given: ""');
        });

        it('should throw an error if given an invalid sort', () => {
            const req = fakeReq({ sort: 'example' });
            expect(() => {
                utils.getSearchOptions(req, { sort_enabled: true });
            }).toThrowWithMessage(TSError, 'Invalid sort parameter, must be field_name:asc or field_name:desc, was given: "example"');
        });

        it('should throw an error if given an object as sort', () => {
            const req = fakeReq({ sort: { example: true } });
            expect(() => {
                utils.getSearchOptions(req, { sort_enabled: true });
            }).toThrowWithMessage(TSError, 'Invalid sort parameter, must be a valid string, was given: "{"example":true}"');
        });

        it('should throw an error if given an invalid sort on date', () => {
            const req = fakeReq({ sort: 'wrongdate:asc' });
            expect(() => {
                utils.getSearchOptions(req, {
                    sort_enabled: true,
                    default_date_field: 'somedate',
                    sort_dates_only: true
                });
            }).toThrowWithMessage(TSError, 'Invalid sort parameter, sorting currently available for the "somedate" field only, was given: "wrongdate:asc"');
        });

        it('should be able to return the options', () => {
            const req = fakeReq({ q: 'hello', sort: 'example:asc' });
            const result = utils.getSearchOptions(req, {
                sort_default: 'default:asc',
                sort_enabled: true
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
                pretty: false,
                q: 'hello',
                size: 100,
                sortDisabled: false,
                start: undefined
            });
        });
    });

    describe('search', () => {
        it('should throw if no indexConfig is given', async () => {
            expect.hasAssertions();

            try {
                // @ts-ignore
                await utils.search(fakeReq(), {}, {}, {});
            } catch (err) {
                expect(err.toString()).toEqual('TSError: Search is not configured correctly');
            }
        });

        it('should throw if no index is given', async () => {
            expect.hasAssertions();

            try {
                // @ts-ignore
                await utils.search(fakeReq(), { }, { other: true }, {});
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

            const config: utils.SearchConfig = { };
            const options: utils.SearchResponseOpts = {
                size: 2,
                sortDisabled: true,
            };

            const result = utils.handleSearchResponse(input as SearchResponse<any>, config, options);
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
                preserve_index_name: true,
            };

            const options: utils.SearchResponseOpts = {
                size: 2,
                sortDisabled: true,
            };

            const result = utils.handleSearchResponse(input as SearchResponse<any>, config, options);
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

function fakeReq(query = {}, body = {}): Request {
    const req: unknown = {
        query,
        body,
    };

    return req as Request;
}

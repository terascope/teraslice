import 'jest-extended';
import { Request } from 'express';
import { getSearchOptions } from '../src/search/utils';
import { TSError } from '@terascope/utils';

describe('Search Utils', () => {
    describe('getSearchOptions', () => {
        it('should throw an error if given an invalid size', () => {
            const req = fakeReq({ size: 'ugh' });
            expect(() => {
                getSearchOptions(req, {});
            }).toThrowWithMessage(TSError, 'Invalid size parameter, must be a valid number, was given: "ugh"');
        });

        it('should throw an error if given size too large', () => {
            const req = fakeReq({ size: 1000 });
            expect(() => {
                getSearchOptions(req, { max_query_size: 500 });
            }).toThrowWithMessage(TSError, 'Invalid size parameter, must be less than 500, was given: "1000"');
        });

        it('should throw an error if given an invalid start', () => {
            const req = fakeReq({ start: 'bah' });
            expect(() => {
                getSearchOptions(req, { });
            }).toThrowWithMessage(TSError, 'Invalid start parameter, must be a valid number, was given: "bah"');
        });

        it('should throw an error if given an invalid query', () => {
            const req = fakeReq({ q: null });
            expect(() => {
                getSearchOptions(req, { require_query: true });
            }).toThrowWithMessage(TSError, 'Invalid q parameter, must not be empty, was given: ""');
        });

        it('should throw an error if given an invalid sort', () => {
            const req = fakeReq({ sort: 'example' });
            expect(() => {
                getSearchOptions(req, { sort_enabled: true });
            }).toThrowWithMessage(TSError, 'Invalid sort parameter, must be field_name:asc or field_name:desc, was given: "example"');
        });

        it('should throw an error if given an object as sort', () => {
            const req = fakeReq({ sort: { example: true } });
            expect(() => {
                getSearchOptions(req, { sort_enabled: true });
            }).toThrowWithMessage(TSError, 'Invalid sort parameter, must be a valid string, was given: "{"example":true}"');
        });

        it('should throw an error if given an invalid sort on date', () => {
            const req = fakeReq({ sort: 'wrongdate:asc' });
            expect(() => {
                getSearchOptions(req, {
                    sort_enabled: true,
                    date_field: 'somedate',
                    sort_dates_only: true
                });
            }).toThrowWithMessage(TSError, 'Invalid sort parameter, sorting currently available for the "somedate" field only, was given: "wrongdate:asc"');
        });

        it('should be able to return the options', () => {
            const req = fakeReq({ q: 'hello', sort: 'example:asc' });
            const result = getSearchOptions(req, {
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
        it('should be able to search', () => {
            expect(true).toBeTrue();
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

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
            }).toThrowWithMessage(TSError, 'Invalid size parameter, must be a valid number, was given: ugh');
        });

        it('should throw an error if given size too large', () => {
            const req = fakeReq({ size: 1000 });
            expect(() => {
                getSearchOptions(req, { max_query_size: 500 });
            }).toThrowWithMessage(TSError, 'Invalid size parameter, must be less than 500, was given: 1000');
        });

        it('should throw an error if given an invalid start', () => {
            const req = fakeReq({ start: 'bah' });
            expect(() => {
                getSearchOptions(req, { });
            }).toThrowWithMessage(TSError, 'Invalid start parameter, must be a valid number, was given: bah');
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

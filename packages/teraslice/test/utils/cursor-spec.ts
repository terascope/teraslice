import 'jest-extended';
import { encodeCursor, decodeCursor, queryKey } from '../../src/lib/utils/cursor.js';

describe('cursor', () => {
    const key = queryKey('jobs', { sort: '_updated:desc' });

    /** Encodes `value` the way a cursor is, to make an invalid one */
    function encodeJSON(value: unknown): string {
        return Buffer.from(JSON.stringify(value)).toString('base64url');
    }

    const invalidCursor = expect.objectContaining({
        statusCode: 400,
        message: 'Invalid request query:\n'
            + '✖ Invalid cursor. Send the next_cursor of a previous page as it is\n'
            + '  → at cursor',
    });

    describe('encodeCursor and decodeCursor', () => {
        it('should round trip each kind of sort value', () => {
            const cursor = {
                after: [1700000000000, 'job-1', null, 1.5, 'Infinity'],
                from: 200,
                key,
            };

            expect(decodeCursor(encodeCursor(cursor), key)).toEqual(cursor);
        });

        it('should round trip a bigint with all its digits', () => {
            const after = [2n ** 63n - 1n, -(2n ** 63n), 'job-1'];

            const decoded = decodeCursor(encodeCursor({ after, from: 0, key }), key);

            expect(decoded.after).toEqual(after);
            expect(typeof decoded.after[0]).toBe('bigint');
        });

        it('should make a URL-safe string', () => {
            const cursor = encodeCursor({ after: ['?/+=&', '~~~~'], from: 0, key });

            expect(cursor).toMatch(/^[\w-]+$/);
        });
    });

    describe('decodeCursor', () => {
        it('should reject a cursor that is not base64url JSON', () => {
            expect(() => decodeCursor('not a cursor', key)).toThrow(invalidCursor);
            expect(() => decodeCursor('', key)).toThrow(invalidCursor);
        });

        it('should reject a cursor from another format version', () => {
            expect(() => decodeCursor(encodeJSON({ v: 2, after: ['a'], from: 0, key }), key))
                .toThrow(invalidCursor);
            expect(() => decodeCursor(encodeJSON({ after: ['a'], from: 0, key }), key))
                .toThrow(invalidCursor);
        });

        it.each([
            ['no sort values', { after: [] }],
            ['a sort value of the wrong type', { after: [true] }],
            ['a long that is not an integer', { after: [{ long: '1.5' }] }],
            ['a negative from', { from: -1 }],
            ['a fractional from', { from: 1.5 }],
            ['an extra field', { extra: 1 }],
        ])('should reject a cursor with %s', (_name, change) => {
            const cursor = encodeJSON({
                v: 1, after: ['a'], from: 0, key, ...change
            });
            expect(() => decodeCursor(cursor, key)).toThrow(invalidCursor);
        });

        it('should reject a cursor made for a different query', () => {
            const cursor = encodeCursor({
                after: ['a'], from: 100, key: queryKey('jobs', { sort: 'name:asc' })
            });

            expect(() => decodeCursor(cursor, key)).toThrow(expect.objectContaining({
                statusCode: 400,
                message: 'Invalid request query:\n'
                    + '✖ The cursor is for a different query. Send the same params as the '
                    + 'request that returned it, other than size, fields, headers and ex\n'
                    + '  → at cursor',
            }));
        });
    });

    describe('queryKey', () => {
        it('should be the same for the same list and params, in any order', () => {
            expect(queryKey('jobs', { sort: 'a', filter: 'b' }))
                .toBe(queryKey('jobs', { filter: 'b', sort: 'a' }));
        });

        it('should leave out undefined params', () => {
            expect(queryKey('jobs', { sort: 'a', filter: undefined }))
                .toBe(queryKey('jobs', { sort: 'a' }));
        });

        it('should differ by list and by each param', () => {
            const keys = [
                queryKey('jobs'),
                queryKey('ex'),
                queryKey('jobs', { sort: 'a' }),
                queryKey('jobs', { sort: 'b' }),
                queryKey('jobs', { sort: 'a', deleted: false }),
                queryKey('jobs', { sort: 'a', deleted: 'false' }),
            ];

            expect(new Set(keys).size).toBe(keys.length);
        });
    });
});

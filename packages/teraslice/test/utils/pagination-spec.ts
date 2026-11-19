import 'jest-extended';
import { TerasliceApiV2 } from '@terascope/types';
import {
    toPage, pageInMemory, pageStart,
    searchFrom, paginationHeaders
} from '../../src/lib/utils/pagination.js';
import { decodeCursor, encodeCursor } from '../../src/lib/utils/cursor.js';

describe('pagination', () => {
    /** A page start without a cursor */
    const at = (from: number) => ({ from, key: 'k' });

    describe('toPage', () => {
        it('should nest the paging fields under pagination key', () => {
            const page = toPage({ records: ['a', 'b'], total: 5 }, at(0), 2);

            expect(page).toEqual({
                data: ['a', 'b'],
                pagination: {
                    total: 5, from: 0, size: 2, has_more: true, next_cursor: null
                },
            });
        });

        describe('has_more', () => {
            it('should be true when records come after the page', () => {
                expect(toPage({ records: ['c', 'd'], total: 5 }, at(2), 2)
                    .pagination.has_more).toBeTrue();
            });

            it('should be false on a short last page', () => {
                expect(toPage({ records: ['e'], total: 5 }, at(4), 2)
                    .pagination.has_more).toBeFalse();
            });

            it('should be false on an exactly full last page', () => {
                expect(toPage({ records: ['c', 'd'], total: 4 }, at(2), 2)
                    .pagination.has_more).toBeFalse();
            });

            it('should be false past the end', () => {
                expect(toPage({ records: [], total: 4 }, at(10), 2)
                    .pagination.has_more).toBeFalse();
            });

            it('should be true with size 0 when anything matches', () => {
                expect(toPage({ records: [], total: 4 }, at(0), 0)
                    .pagination.has_more).toBeTrue();
                expect(toPage({ records: [], total: 0 }, at(0), 0)
                    .pagination.has_more).toBeFalse();
            });

            describe('after a cursor', () => {
                /** A page start after a cursor that counted `from` records */
                const after = (from: number) => ({ from, after: ['x'], key: 'k' });

                it('should be true on a full page, even when the count says it\'s the last', () => {
                    // a record before the cursor was deleted: the total
                    // dropped but the cursor's count didn't, and 'e' is left
                    expect(toPage({ records: ['c', 'd'], total: 4 }, after(2), 2)
                        .pagination.has_more).toBeTrue();
                });

                it('should be false on a short page, even when the count says there are more', () => {
                    // a record before the cursor was added: the total grew
                    // but the cursor's count didn't
                    expect(toPage({ records: ['e'], total: 6 }, after(4), 2)
                        .pagination.has_more).toBeFalse();
                });

                it('should be false on an empty page', () => {
                    expect(toPage({ records: [], total: 4 }, after(4), 2)
                        .pagination.has_more).toBeFalse();
                });

                it('should still count with size 0', () => {
                    expect(toPage({ records: [], total: 4 }, after(2), 0)
                        .pagination.has_more).toBeTrue();
                });
            });
        });

        describe('next_cursor', () => {
            it('should continue after the last sort values, counting the records', () => {
                const page = toPage(
                    { records: ['c', 'd'], total: 5, lastSort: [10n ** 19n, 'd'] }, at(2), 2
                );
                expect(decodeCursor(page.pagination.next_cursor as string, 'k')).toEqual({
                    after: [10n ** 19n, 'd'], from: 4, key: 'k'
                });
            });

            it('should be null on the last page', () => {
                expect(toPage({ records: ['e'], total: 5, lastSort: ['e'] }, at(4), 2)
                    .pagination.next_cursor).toBeNull();
            });

            it('should be null with size 0, even with more records', () => {
                expect(toPage({ records: [], total: 4 }, at(0), 0)
                    .pagination.next_cursor).toBeNull();
            });

            it('should be null without sort values', () => {
                expect(toPage({ records: ['a'], total: 4 }, at(0), 1)
                    .pagination.next_cursor).toBeNull();
            });
        });

        it('should match the Pagination response schema', () => {
            const page = toPage({ records: ['a'], total: 10000, lastSort: [1] }, at(0), 1);
            expect(page.pagination.next_cursor).toBeString();
            expect(TerasliceApiV2.PaginationSchema.parse(page.pagination))
                .toEqual(page.pagination);
        });
    });

    describe('pageStart', () => {
        it('should start at from without a cursor', () => {
            expect(pageStart({ from: 30 }, 'k')).toEqual({ from: 30, key: 'k' });
        });

        it('should start after the cursor, at its from', () => {
            const cursor = encodeCursor({ after: ['x', 1], from: 200, key: 'k' });
            expect(pageStart({ from: 0, cursor }, 'k')).toEqual({
                from: 200, after: ['x', 1], key: 'k'
            });
        });

        it('should reject a cursor for another key', () => {
            const cursor = encodeCursor({ after: ['x'], from: 200, key: 'other' });
            expect(() => pageStart({ from: 0, cursor }, 'k'))
                .toThrow('The cursor is for a different query');
        });
    });

    describe('searchFrom', () => {
        it('should search from from without a cursor', () => {
            expect(searchFrom(at(30))).toEqual({ from: 30 });
        });

        it('should search after the cursor from 0', () => {
            expect(searchFrom({ from: 200, after: ['x'], key: 'k' }))
                .toEqual({ from: 0, searchAfter: ['x'] });
        });
    });

    describe('paginationHeaders', () => {
        const pagination = {
            total: 5, from: 0, size: 2, has_more: true, next_cursor: null
        };

        it('should leave out X-Next-Cursor without a next cursor', () => {
            expect(paginationHeaders(pagination)).toEqual({
                'X-Total-Count': '5', 'X-From': '0', 'X-Size': '2'
            });
        });

        it('should send the next cursor', () => {
            expect(paginationHeaders({ ...pagination, next_cursor: 'abc' }))
                .toHaveProperty('X-Next-Cursor', 'abc');
        });
    });

    describe('pageInMemory', () => {
        const list = [{ id: 'c' }, { id: 'a' }, { id: 'e' }, { id: 'b' }, { id: 'd' }];

        it('should sort, then return the page, an exact total and the last keys', () => {
            expect(pageInMemory(list, ['id'], at(1), 2)).toEqual({
                records: [{ id: 'b' }, { id: 'c' }],
                total: 5,
                lastSort: ['c'],
            });
        });

        it('should return a short last page', () => {
            expect(pageInMemory(list, ['id'], at(4), 2).records).toEqual([{ id: 'e' }]);
        });

        it('should return no records past the end, with the total', () => {
            expect(pageInMemory(list, ['id'], at(10), 2)).toEqual({
                records: [], total: 5, lastSort: undefined
            });
        });

        it('should leave the list unsorted', () => {
            pageInMemory(list, ['id'], at(0), 5);
            expect(list.map(({ id }) => id)).toEqual(['c', 'a', 'e', 'b', 'd']);
        });

        it('should start after the given keys, ignoring from', () => {
            expect(pageInMemory(list, ['id'], { from: 0, after: ['b'] }, 2).records)
                .toEqual([{ id: 'c' }, { id: 'd' }]);
        });

        it('should start at the next item when the last one went away', () => {
            const withoutB = list.filter(({ id }) => id !== 'b');
            expect(pageInMemory(withoutB, ['id'], { from: 2, after: ['b'] }, 2).records)
                .toEqual([{ id: 'c' }, { id: 'd' }]);
        });

        it('should return no records after the last item', () => {
            expect(pageInMemory(list, ['id'], { from: 5, after: ['e'] }, 2).records)
                .toEqual([]);
        });

        it('should compare by each key, numbers as numbers, missing values first', () => {
            const rows = [
                { a: 'x', n: 10 }, { a: 'x', n: 9 }, { a: 'w', n: 1 }, { n: 5 }
            ];
            const page = pageInMemory(rows, ['a', 'n'], at(0), 4);
            expect(page.records).toEqual([
                { n: 5 }, { a: 'w', n: 1 }, { a: 'x', n: 9 }, { a: 'x', n: 10 }
            ]);
            expect(page.lastSort).toEqual(['x', 10]);
            expect(pageInMemory(rows, ['a', 'n'], { from: 0, after: [null, 5] }, 1).records)
                .toEqual([{ a: 'w', n: 1 }]);
        });

        it('should page through every item once with cursors, ending with no cursor', () => {
            const seen: string[] = [];
            let cursor: string | undefined;

            do {
                const start = pageStart({ from: 0, cursor }, 'k');
                const page = toPage(pageInMemory(list, ['id'], start, 2), start, 2);
                seen.push(...page.data.map(({ id }) => id));
                cursor = page.pagination.next_cursor ?? undefined;
            } while (cursor);

            expect(seen).toEqual(['a', 'b', 'c', 'd', 'e']);
        });
    });

    describe('paged response schemas', () => {
        const pagination = {
            total: 1, from: 0, size: 100, has_more: false, next_cursor: null
        };

        const sliceError = {
            slice_id: 's',
            slicer_id: 0,
            slicer_order: 1,
            request: '{}',
            state: 'error',
            ex_id: 'ex',
            _created: '2026-01-01T00:00:00.000Z',
            _updated: '2026-01-01T00:00:00.000Z',
        };

        it('should accept a page of the item schema', () => {
            const page = { data: [sliceError], pagination };
            expect(TerasliceApiV2.SliceErrorPageSchema.safeParse(page).error).toBeUndefined();
        });

        it('should check the items against the item schema', () => {
            const page = { data: [{ ...sliceError, state: 'unknown' }], pagination };
            expect(TerasliceApiV2.SliceErrorPageSchema.safeParse(page).success).toBeFalse();
        });

        it('should reject a negative total', () => {
            const page = { data: [], pagination: { ...pagination, total: -1 } };
            expect(TerasliceApiV2.SliceErrorPageSchema.safeParse(page).success).toBeFalse();
        });
    });
});

import 'jest-extended';
import { TerasliceApiV2 } from '@terascope/types';
import { toPage, pageInMemory } from '../../src/lib/utils/pagination.js';

describe('pagination', () => {
    describe('toPage', () => {
        it('should nest the paging fields under pagination key', () => {
            const page = toPage({ records: ['a', 'b'], total: 5 }, 0, 2);

            expect(page).toEqual({
                data: ['a', 'b'],
                pagination: {
                    total: 5, from: 0, size: 2, has_more: true, next_cursor: null
                },
            });
        });

        describe('has_more', () => {
            it('should be true when records come after the page', () => {
                expect(toPage({ records: ['c', 'd'], total: 5 }, 2, 2)
                    .pagination.has_more).toBeTrue();
            });

            it('should be false on a short last page', () => {
                expect(toPage({ records: ['e'], total: 5 }, 4, 2)
                    .pagination.has_more).toBeFalse();
            });

            it('should be false on an exactly full last page', () => {
                expect(toPage({ records: ['c', 'd'], total: 4 }, 2, 2)
                    .pagination.has_more).toBeFalse();
            });

            it('should be false past the end', () => {
                expect(toPage({ records: [], total: 4 }, 10, 2)
                    .pagination.has_more).toBeFalse();
            });

            it('should be true with size 0 when anything matches', () => {
                expect(toPage({ records: [], total: 4 }, 0, 0)
                    .pagination.has_more).toBeTrue();
                expect(toPage({ records: [], total: 0 }, 0, 0)
                    .pagination.has_more).toBeFalse();
            });
        });

        it('should match the Pagination response schema', () => {
            const page = toPage({ records: [], total: 10000 }, 0, 100);
            expect(TerasliceApiV2.PaginationSchema.parse(page.pagination))
                .toEqual(page.pagination);
        });
    });

    describe('pageInMemory', () => {
        const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id);
        const list = [{ id: 'c' }, { id: 'a' }, { id: 'e' }, { id: 'b' }, { id: 'd' }];

        it('should sort, then return the page and an exact total', () => {
            expect(pageInMemory(list, byId, 1, 2)).toEqual({
                records: [{ id: 'b' }, { id: 'c' }],
                total: 5,
            });
        });

        it('should return a short last page', () => {
            expect(pageInMemory(list, byId, 4, 2).records).toEqual([{ id: 'e' }]);
        });

        it('should return no records past the end, with the total', () => {
            expect(pageInMemory(list, byId, 10, 2)).toEqual({
                records: [], total: 5
            });
        });

        it('should leave the list unsorted', () => {
            pageInMemory(list, byId, 0, 5);
            expect(list.map(({ id }) => id)).toEqual(['c', 'a', 'e', 'b', 'd']);
        });

        it('should page through every item once, ending with has_more false', () => {
            const seen: string[] = [];
            let from = 0;
            let hasMore = true;

            while (hasMore) {
                const page = toPage(pageInMemory(list, byId, from, 2), from, 2);
                seen.push(...page.data.map(({ id }) => id));
                hasMore = page.pagination.has_more;
                from += 2;
            }

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

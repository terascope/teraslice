import { jest } from '@jest/globals';
import { TestContext } from '@terascope/job-components';
import { JobsStorage, ExecutionStorage, StateStorage } from '../../src/lib/storage/index.js';

/**
 * searchWithTotal on the storage classes, with the backend stubbed so
 * no search cluster is needed
 */
describe('storage searchWithTotal', () => {
    const context = new TestContext('search-with-total') as any;
    // ExecutionStorage registers its metadata functions on construction,
    // which TestContext's executionContext doesn't have
    context.apis.executionContext.registerMetadataFns = jest.fn();
    let backendSearchWithTotal: jest.Mock<(...args: any[]) => Promise<any>>;

    function stubBackend(storage: JobsStorage | ExecutionStorage | StateStorage) {
        backendSearchWithTotal = jest.fn<(...args: any[]) => Promise<any>>();
        (storage as any).backend.searchWithTotal = backendSearchWithTotal;
    }

    describe('JobsStorage', () => {
        it('should pass the search through and return the page', async () => {
            const storage = new JobsStorage(context);
            stubBackend(storage);
            const result = { records: [{ job_id: 'a' }], total: 25, lastSort: [1, 'a'] };
            backendSearchWithTotal.mockResolvedValue(result);
            const search = {
                query: '_context:job', from: 20, size: 1, sort: '_created:desc', fields: ['job_id']
            };

            await expect(storage.searchWithTotal(search)).resolves.toEqual(result);

            expect(backendSearchWithTotal).toHaveBeenCalledWith(search);
        });
    });

    describe('ExecutionStorage', () => {
        it('should pass the search through and return the page', async () => {
            const storage = new ExecutionStorage(context);
            stubBackend(storage);
            const result = { records: [{ ex_id: 'a' }], total: 3, lastSort: [1, 'a'] };
            backendSearchWithTotal.mockResolvedValue(result);
            const search = { query: '_context:ex', size: 1, searchAfter: [0, 'z'] };

            await expect(storage.searchWithTotal(search)).resolves.toEqual(result);

            expect(backendSearchWithTotal).toHaveBeenCalledWith(search);
        });
    });

    describe('StateStorage', () => {
        it('should return the page, sorted by _updated:desc', async () => {
            const storage = new StateStorage(context);
            stubBackend(storage);
            const result = { records: [{ slice_id: 'a' }], total: 12000 };
            backendSearchWithTotal.mockResolvedValue(result);

            await expect(storage.searchWithTotal({ query: 'state:error', from: 0, size: 100 }))
                .resolves.toEqual(result);

            expect(backendSearchWithTotal).toHaveBeenCalledWith({
                query: 'state:error', from: 0, size: 100, sort: '_updated:desc'
            });
        });

        it('should pass a given sort through', async () => {
            const storage = new StateStorage(context);
            stubBackend(storage);
            backendSearchWithTotal.mockResolvedValue({ records: [], total: 0 });

            await storage.searchWithTotal({ query: 'state:error', sort: 'slicer_order:asc' });

            expect(backendSearchWithTotal.mock.calls[0][0].sort).toBe('slicer_order:asc');
        });
    });
});

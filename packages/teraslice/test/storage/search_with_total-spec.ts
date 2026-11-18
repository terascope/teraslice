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
        it('should return the page with its total', async () => {
            const storage = new JobsStorage(context);
            stubBackend(storage);
            const result = { records: [{ job_id: 'a' }], total: 25 };
            backendSearchWithTotal.mockResolvedValue(result);

            await expect(storage.searchWithTotal('_context:job', 20, 1, '_created:desc', ['job_id']))
                .resolves.toEqual(result);

            expect(backendSearchWithTotal).toHaveBeenCalledWith(
                '_context:job', 20, 1, '_created:desc', ['job_id']
            );
        });
    });

    describe('ExecutionStorage', () => {
        it('should return the page with its total', async () => {
            const storage = new ExecutionStorage(context);
            stubBackend(storage);
            const result = { records: [{ ex_id: 'a' }], total: 3 };
            backendSearchWithTotal.mockResolvedValue(result);

            await expect(storage.searchWithTotal('_context:ex', 0, 1))
                .resolves.toEqual(result);

            expect(backendSearchWithTotal).toHaveBeenCalledWith(
                '_context:ex', 0, 1, undefined, undefined
            );
        });
    });

    describe('StateStorage', () => {
        it('should return the page with its total, sorted by _updated:desc', async () => {
            const storage = new StateStorage(context);
            stubBackend(storage);
            const result = { records: [{ slice_id: 'a' }], total: 12000 };
            backendSearchWithTotal.mockResolvedValue(result);

            await expect(storage.searchWithTotal('state:error', 0, 100))
                .resolves.toEqual(result);

            expect(backendSearchWithTotal).toHaveBeenCalledWith(
                'state:error', 0, 100, '_updated:desc', undefined
            );
        });

        it('should pass a given sort through', async () => {
            const storage = new StateStorage(context);
            stubBackend(storage);
            backendSearchWithTotal.mockResolvedValue({ records: [], total: 0 });

            await storage.searchWithTotal('state:error', 0, 100, 'slicer_order:asc');

            expect(backendSearchWithTotal.mock.calls[0][3]).toBe('slicer_order:asc');
        });
    });
});

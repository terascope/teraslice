import { jest } from '@jest/globals';
import 'jest-extended';
import { debugLogger } from '@terascope/core-utils';
import { TerasliceElasticsearchStorage } from '../../src/lib/storage/backends/elasticsearch_store.js';

describe('TerasliceElasticsearchStorage', () => {
    describe('->searchWithTotal', () => {
        let store: TerasliceElasticsearchStorage;
        let searchWithTotal: jest.Mock<(...args: any[]) => Promise<any>>;
        let search: jest.Mock<(...args: any[]) => Promise<any>>;

        beforeEach(() => {
            const context = { sysconfig: { teraslice: {} } } as any;
            store = new TerasliceElasticsearchStorage({
                context,
                indexName: 'test__jobs',
                recordType: 'job',
                idField: 'job_id',
                storageName: 'jobs',
                logger: debugLogger('elasticsearch-store-spec'),
            });
            searchWithTotal = jest.fn<(...args: any[]) => Promise<any>>();
            search = jest.fn<(...args: any[]) => Promise<any>>();
            store.api = { searchWithTotal, search } as any;
        });

        it('should return the records and a total past the page', async () => {
            const result = { records: [{ job_id: 'a' }, { job_id: 'b' }], total: 57, relation: 'eq' };
            searchWithTotal.mockResolvedValue(result);

            await expect(store.searchWithTotal('job_id:*', 10, 2, '_created:desc', ['job_id'], undefined, true))
                .resolves.toEqual(result);

            expect(searchWithTotal).toHaveBeenCalledWith({
                index: 'test__jobs',
                from: 10,
                size: 2,
                sort: '_created:desc',
                q: 'job_id:*',
                _source_includes: ['job_id'],
                track_total_hits: true,
            });
        });

        it('should build the same query as search() and leave out track_total_hits by default', async () => {
            searchWithTotal.mockResolvedValue({ records: [], total: 10000, relation: 'gte' });
            search.mockResolvedValue([]);
            const body = { query: { match_all: {} } };

            await store.searchWithTotal(body, 0, 100, undefined, undefined, 'other*');
            await store.search(body, 0, 100, undefined, undefined, 'other*');

            const [query] = searchWithTotal.mock.calls[0];
            expect(query).toEqual(search.mock.calls[0][0]);
            expect(query).toEqual({
                index: 'other*', from: 0, size: 100, sort: undefined, body
            });
            expect(query).not.toHaveProperty('track_total_hits');
        });

        it('should pass a numeric trackTotalHits through', async () => {
            searchWithTotal.mockResolvedValue({ records: [], total: 0, relation: 'eq' });

            await store.searchWithTotal('*', 0, 10, undefined, undefined, undefined, 500);

            expect(searchWithTotal.mock.calls[0][0]).toHaveProperty('track_total_hits', 500);
        });

        it('should reject trackTotalHits: false', async () => {
            await expect(store.searchWithTotal('*', 0, 10, undefined, undefined, undefined, false))
                .rejects.toThrow('trackTotalHits can\'t be false');
            expect(searchWithTotal).not.toHaveBeenCalled();
        });

        it('should check from, size and sort like search()', async () => {
            await expect(store.searchWithTotal('*', 1.5 as any))
                .rejects.toThrow('from parameter must be a integer, got 1.5');
            await expect(store.searchWithTotal('*', 0, 'ten' as any))
                .rejects.toThrow('size parameter must be a integer, got ten');
            await expect(store.searchWithTotal('*', 0, 10, 5 as any))
                .rejects.toThrow('sort parameter must be a string, got 5');
            expect(searchWithTotal).not.toHaveBeenCalled();
        });
    });

    describe('when shutdown is forced', () => {
        const timeout = 500;
        let store: TerasliceElasticsearchStorage;
        let logger: ReturnType<typeof debugLogger>;

        beforeEach(() => {
            const context = { sysconfig: { teraslice: { shutdown_timeout: 30000 } } } as any;
            logger = debugLogger('elasticsearch-store-spec');
            store = new TerasliceElasticsearchStorage({
                context,
                indexName: 'test__analytics*',
                recordType: 'analytics',
                idField: 'ex_id',
                storageName: 'analytics',
                logger,
            });

            // one queued record, as the analytics store has after a slice
            (store as any).bulkQueue = [{ action: { index: { _index: 'test' } }, data: {} }];
        });

        it('should reject at the timeout when the bulk request hangs', async () => {
            let releaseBulk!: () => void;
            const bulkSend = jest.spyOn(store, 'bulkSend').mockImplementation(
                () => new Promise((resolve) => {
                    releaseBulk = () => resolve(1);
                })
            );
            const logError = jest.spyOn(logger, 'error');

            const start = Date.now();
            await expect(store.shutdown(true, timeout))
                .rejects.toThrow('analytics store shutdown timed out after 500ms, 1 records may not have been saved');

            expect(Date.now() - start).toBeLessThan(timeout + 200);
            expect(bulkSend).toHaveBeenCalledTimes(1);
            expect(logError).toHaveBeenCalledTimes(1);
            expect((store as any).bulkQueue).toBeArrayOfSize(0);
            expect((store as any).isShuttingDown).toBeTrue();

            releaseBulk();
        });

        it('should resolve when the bulk request succeeds', async () => {
            const bulkSend = jest.spyOn(store, 'bulkSend').mockResolvedValue(1);
            const logError = jest.spyOn(logger, 'error');

            await expect(store.shutdown(true, timeout)).resolves.toBeUndefined();

            expect(bulkSend).toHaveBeenCalledTimes(1);
            expect(logError).not.toHaveBeenCalled();
            expect((store as any).isShuttingDown).toBeTrue();
        });

        it('should log and reject with the bulk request error when it fails', async () => {
            jest.spyOn(store, 'bulkSend').mockRejectedValue(new Error('Bulk Error'));
            const logError = jest.spyOn(logger, 'error');

            await expect(store.shutdown(true, timeout)).rejects.toThrow('Bulk Error');

            expect(logError).toHaveBeenCalledTimes(1);
            expect((store as any).bulkQueue).toBeArrayOfSize(0);
        });

        it('should wait for a hung background flush and count its records', async () => {
            const releases: (() => void)[] = [];
            const bulkSend = jest.spyOn(store, 'bulkSend').mockImplementation(
                () => new Promise((resolve) => {
                    releases.push(() => resolve(1));
                })
            );
            const logError = jest.spyOn(logger, 'error');

            // the background flush takes the queued record and hangs
            const backgroundFlush = (store as any)._flush();
            (store as any).bulkQueue.push({ action: { index: { _index: 'test' } }, data: {} });

            const start = Date.now();
            await expect(store.shutdown(true, timeout))
                .rejects.toThrow('analytics store shutdown timed out after 500ms, 2 records may not have been saved');

            expect(Date.now() - start).toBeGreaterThanOrEqual(timeout - 50);
            expect(bulkSend).toHaveBeenCalledTimes(2);
            expect(logError).toHaveBeenCalledTimes(1);

            releases.forEach((release) => release());
            await backgroundFlush;
        });

        it('should resolve once a background flush in flight lands', async () => {
            const bulkSend = jest.spyOn(store, 'bulkSend').mockImplementation(
                () => new Promise((resolve) => {
                    setTimeout(() => resolve(1), 100);
                })
            );
            const logError = jest.spyOn(logger, 'error');

            // the background flush takes the only queued record
            const backgroundFlush = (store as any)._flush();
            let landed = false;
            backgroundFlush.then(() => {
                landed = true;
            });

            await expect(store.shutdown(true, timeout)).resolves.toBeUndefined();

            expect(landed).toBeTrue();
            expect(bulkSend).toHaveBeenCalledTimes(1);
            expect(logError).not.toHaveBeenCalled();
        });
    });
});

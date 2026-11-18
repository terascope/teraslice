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

        it('should ask for an exact total and return the records, total and sort values', async () => {
            const records = [{ job_id: 'a' }, { job_id: 'b' }];
            searchWithTotal.mockResolvedValue({
                records, total: 57, relation: 'eq', lastSort: [1700000000000, 'b']
            });

            await expect(store.searchWithTotal({
                query: 'job_id:*', from: 10, size: 2, sort: '_created:desc', fields: ['job_id']
            })).resolves.toEqual({ records, total: 57, lastSort: [1700000000000, 'b'] });

            expect(searchWithTotal).toHaveBeenCalledWith({
                index: 'test__jobs',
                from: 10,
                size: 2,
                sort: '_created:desc,job_id:asc',
                q: 'job_id:*',
                _source_includes: ['job_id'],
                track_total_hits: true,
            });
        });

        it('should build the same query as search(), plus track_total_hits', async () => {
            searchWithTotal.mockResolvedValue({ records: [], total: 0, relation: 'eq' });
            search.mockResolvedValue([]);
            const body = { query: { match_all: {} } };

            await store.searchWithTotal({ query: body, from: 0, size: 100, sort: 'job_id:asc' });
            await store.search(body, 0, 100, 'job_id:asc');

            expect(searchWithTotal.mock.calls[0][0]).toEqual({
                ...search.mock.calls[0][0],
                track_total_hits: true,
            });
        });

        describe('sort', () => {
            async function sortFor(sort: string | undefined) {
                searchWithTotal.mockResolvedValue({ records: [], total: 0, relation: 'eq' });
                await store.searchWithTotal({ query: '*', sort });
                return searchWithTotal.mock.calls[0][0].sort;
            }

            it('should sort by the id field with no sort', async () => {
                await expect(sortFor(undefined)).resolves.toBe('job_id:asc');
                searchWithTotal.mockClear();
                await expect(sortFor('')).resolves.toBe('job_id:asc');
            });

            it('should add the id field to the end of the sort', async () => {
                await expect(sortFor('_updated:desc,name:asc'))
                    .resolves.toBe('_updated:desc,name:asc,job_id:asc');
            });

            it('should keep a sort that already sorts by the id field', async () => {
                await expect(sortFor('job_id:desc')).resolves.toBe('job_id:desc');
                searchWithTotal.mockClear();
                await expect(sortFor('_updated:desc, job_id')).resolves.toBe('_updated:desc, job_id');
            });

            it('should not match a field that only starts with the id field', async () => {
                await expect(sortFor('job_id_old:asc')).resolves.toBe('job_id_old:asc,job_id:asc');
            });
        });

        describe('searchAfter', () => {
            const searchAfter = [1700000000000, null, 2n ** 63n - 1n, 'b'];

            beforeEach(() => {
                searchWithTotal.mockResolvedValue({ records: [], total: 0, relation: 'eq' });
            });

            it('should send a query string as q, with search_after in the body', async () => {
                await store.searchWithTotal({ query: 'job_id:*', size: 2, sort: '_updated:desc', searchAfter });

                expect(searchWithTotal).toHaveBeenCalledWith({
                    index: 'test__jobs',
                    from: 0,
                    size: 2,
                    sort: '_updated:desc,job_id:asc',
                    q: 'job_id:*',
                    body: { search_after: searchAfter },
                    track_total_hits: true,
                });
            });

            it('should add search_after to a query body', async () => {
                const body = { query: { match_all: {} } };

                await store.searchWithTotal({ query: body, size: 2, searchAfter });

                expect(searchWithTotal.mock.calls[0][0].body)
                    .toEqual({ query: { match_all: {} }, search_after: searchAfter });
                expect(body).toEqual({ query: { match_all: {} } });
            });

            it('should reject from with searchAfter', async () => {
                await expect(store.searchWithTotal({ query: '*', from: 10, searchAfter }))
                    .rejects.toThrow('from parameter must be 0 with searchAfter, got 10');
                expect(searchWithTotal).not.toHaveBeenCalled();
            });
        });

        it('should check from, size and sort like search()', async () => {
            await expect(store.searchWithTotal({ query: '*', from: 1.5 }))
                .rejects.toThrow('from parameter must be a integer, got 1.5');
            await expect(store.searchWithTotal({ query: '*', size: 'ten' as any }))
                .rejects.toThrow('size parameter must be a integer, got ten');
            await expect(store.searchWithTotal({ query: '*', sort: 5 as any }))
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

import { jest } from '@jest/globals';
import 'jest-extended';
import { debugLogger } from '@terascope/core-utils';
import { TerasliceElasticsearchStorage } from '../../src/lib/storage/backends/elasticsearch_store.js';

describe('TerasliceElasticsearchStorage', () => {
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

import 'jest-extended';
import path from 'path';
import {
    newTestJobConfig,
    newTestSlice,
    DataEntity,
    Fetcher,
    BatchProcessor,
    NoopProcessor,
} from '@terascope/job-components';
import { WorkerTestHarness } from '../src';

describe('WorkerTestHarness', () => {
    const clients = [
        {
            type: 'example',
            create: () => ({
                client: {
                    say() {
                        return 'hello';
                    }
                }
            })
        }
    ];

    describe('when given a valid job config', () => {
        const job = newTestJobConfig();
        job.max_retries = 2;
        job.analytics = true;
        job.operations = [
            {
                _op: 'test-reader',
            },
            {
                _op: 'noop',
            }
        ];

        const workerHarness = new WorkerTestHarness(job, {
            assetDir: path.join(__dirname, 'fixtures'),
            clients
        });

        workerHarness.processors[0].handle = jest.fn(async (data: DataEntity[]) => {
            return data;
        });

        it('should be able to call initialize', () => {
            return expect(workerHarness.initialize()).resolves.toBeNil();
        });

        it('should have fetcher', () => {
            expect(workerHarness.fetcher()).toBeInstanceOf(Fetcher);
        });

        it('should have on processor', () => {
            expect(workerHarness.processors).toBeArrayOfSize(1);
            expect(workerHarness.processors[0]).toBeInstanceOf(BatchProcessor);
        });

        it('should be able to call runSlice', async () => {
            const result = await workerHarness.runSlice(newTestSlice());
            expect(result).toBeArray();
            expect(DataEntity.isDataEntityArray(result)).toBeTrue();
        });

        it('should be able to call runSlice with just a request object', async () => {
            const result = await workerHarness.runSlice({ hello: true });
            expect(result).toBeArray();
            expect(DataEntity.isDataEntityArray(result)).toBeTrue();
        });

        it('should call slice retry', async () => {
            const onSliceRetryEvent = jest.fn();
            workerHarness.events.on('slice:retry', onSliceRetryEvent);
            const err = new Error('oh no');

            workerHarness.processors[0].handle
                // @ts-ignore
                .mockClear()
                // @ts-ignore
                .mockRejectedValueOnce(err)
                // @ts-ignore
                .mockRejectedValueOnce(err);

            const results = await workerHarness.runSlice({ });
            expect(results).toBeArray();

            expect(onSliceRetryEvent).toHaveBeenCalledTimes(2);
            expect(workerHarness.getOperation<NoopProcessor>('noop').handle).toHaveBeenCalledTimes(3);
        });

        it('should be able to call runSlice with fullResponse', async () => {
            const result = await workerHarness.runSlice(newTestSlice(), { fullResponse: true });
            expect(result.analytics).not.toBeNil();
            expect(result.results).toBeArray();
        });

        it('should be able to call shutdown', () => {
            return expect(workerHarness.shutdown()).resolves.toBeNil();
        });
    });
});

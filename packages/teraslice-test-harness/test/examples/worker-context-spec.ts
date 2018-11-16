import 'jest-extended';
import path from 'path';
import SimpleClient from './helpers/simple-client';
import { WorkerTestHarness, newTestJobConfig, newTestSlice } from '../../src';

describe('Example Asset (Worker Test Harness)', () => {
    const clients = [
        {
            type: 'simple-client',
            create: () => new SimpleClient(),
        }
    ];

    const job = newTestJobConfig();
    job.analytics = true;
    job.operations = [
        {
            _op: 'simple-reader'
        },
        {
            _op: 'noop'
        }
    ];

    const harness = new WorkerTestHarness(job, {
        clients,
        assetDir: path.join(__dirname, '..', 'fixtures'),
    });

    beforeAll(async () => {
        await harness.initialize();
    });

    afterAll(async () => {
        await harness.shutdown();
    });

    it('should return a list of records', async () => {
        const results = await harness.runSlice(newTestSlice());
        expect(results).toBeArray();
    });
});

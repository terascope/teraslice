import 'jest-extended';
import path from 'path';
import { DataEntity, SliceRequest } from '@terascope/job-components';
import SimpleClient from './helpers/simple-client';
import {
    JobTestHarness,
    newTestJobConfig,
    newTestSlice,
    SlicerTestHarness,
    WorkerTestHarness,
} from '../../src';

describe('Example Asset', () => {
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

    describe('using the WorkerTestHarness', () => {
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
            const testSlice = newTestSlice();
            testSlice.request = { count: 10 };
            const results = await harness.runSlice(testSlice) as DataEntity[];

            expect(results).toBeArrayOfSize(10);

            for (const result of results) {
                expect(DataEntity.isDataEntity(result)).toBeTrue();
            }
        });
    });

    describe('using the SlicerTestHarness', () => {
        const harness = new SlicerTestHarness(job, {
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
            const results = await harness.createSlices() as SliceRequest[];
            expect(results).toBeArrayOfSize(10);

            for (const result of results) {
                expect(DataEntity.isDataEntity(result)).toBeFalse();
                expect(result).toHaveProperty('count', 10);
            }
        });
    });

    describe('using the JobTestHarness', () => {
        const harness = new JobTestHarness(job, {
            clients,
            assetDir: path.join(__dirname, '..', 'fixtures'),
        });

        beforeAll(async () => {
            await harness.initialize();
        });

        afterAll(async () => {
            await harness.shutdown();
        });

        it('should batches of results', async () => {
            const batches = await harness.run();
            expect(batches).toBeArrayOfSize(10);

            for (const results of batches) {
                expect(results).toBeArrayOfSize(10);

                for (const result of results) {
                    expect(DataEntity.isDataEntity(result)).toBeTrue();
                }
            }
        });
    });
});

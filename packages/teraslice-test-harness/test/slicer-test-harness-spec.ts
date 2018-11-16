import 'jest-extended';
import path from 'path';
import {
    newTestJobConfig,
    SliceRequest,
    Slice
} from '@terascope/job-components';
import { SlicerTestHarness } from '../src';

describe('SlicerTestHarness', () => {
    const clients = [
        {
            type: 'example',
            create: () => ({
                say() {
                    return 'hello';
                }
            })
        }
    ];
    describe('when given a valid job config', () => {
        const job = newTestJobConfig();
        job.analytics = true;
        job.operations = [
            {
                _op: 'test-reader',
            },
            {
                _op: 'noop',
            }
        ];

        const jobHarness = new SlicerTestHarness(job, {
            assetDir: path.join(__dirname, 'fixtures'),
            clients,
        });

        it('should be able to call initialize', () => {
            return expect(jobHarness.initialize()).resolves.toBeNil();
        });

        it('should be able to call createSlices', async () => {
            const result = await jobHarness.createSlices() as SliceRequest[];
            expect(result).toBeArray();

            expect(result[0]).not.toHaveProperty('slice_id');
            expect(result[0]).not.toHaveProperty('slicer_id');
            expect(result[0]).not.toHaveProperty('slicer_order');
        });

        it('should be able to call createSlices with fullResponse', async () => {
            const result = await jobHarness.createSlices({ fullResponse: true }) as Slice[];
            expect(result).toBeArray();
            expect(result[0]).toHaveProperty('slice_id');
            expect(result[0]).toHaveProperty('slicer_id');
            expect(result[0]).toHaveProperty('slicer_order');
        });

        it('should be able to call shutdown', () => {
            return expect(jobHarness.shutdown()).resolves.toBeNil();
        });
    });
});

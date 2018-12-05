import 'jest-extended';
import path from 'path';
import {
    newTestJobConfig,
    Slicer
} from '@terascope/job-components';
import { SlicerTestHarness } from '../src';

describe('SlicerTestHarness', () => {
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
        job.analytics = true;
        job.operations = [
            {
                _op: 'test-reader',
            },
            {
                _op: 'noop',
            }
        ];

        const slicerHarness = new SlicerTestHarness(job, {
            assetDir: path.join(__dirname, 'fixtures'),
            clients,
        });

        it('should be able to call initialize', () => {
            return expect(slicerHarness.initialize()).resolves.toBeNil();
        });

        it('should have a slicer', () => {
            expect(slicerHarness.slicer()).toBeInstanceOf(Slicer);
        });

        it('should be able to call createSlices', async () => {
            const result = await slicerHarness.createSlices();
            expect(result).toBeArray();

            expect(result[0]).not.toHaveProperty('slice_id');
            expect(result[0]).not.toHaveProperty('slicer_id');
            expect(result[0]).not.toHaveProperty('slicer_order');
        });

        it('should be able to call createSlices with fullResponse', async () => {
            const result = await slicerHarness.createSlices({ fullResponse: true });
            expect(result).toBeArray();
            expect(result[0]).toHaveProperty('slice_id');
            expect(result[0]).toHaveProperty('slicer_id');
            expect(result[0]).toHaveProperty('slicer_order');
        });

        it('should be able to call shutdown', () => {
            return expect(slicerHarness.shutdown()).resolves.toBeNil();
        });
    });
});

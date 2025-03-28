import { newTestSlice, newTestJobConfig } from '@terascope/job-components';
import JobTestHarness from './job-test-harness.js';
import SlicerTestHarness from './slicer-test-harness.js';
import WorkerTestHarness from './worker-test-harness.js';

export * from './download-external-asset.js';
export * from './interfaces.js';
export {
    JobTestHarness,
    SlicerTestHarness,
    WorkerTestHarness,
    newTestSlice,
    newTestJobConfig,
};

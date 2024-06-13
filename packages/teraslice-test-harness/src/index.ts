import { newTestSlice, newTestJobConfig } from '@terascope/job-components';
import JobTestHarness from './job-test-harness';
import SlicerTestHarness from './slicer-test-harness';
import WorkerTestHarness from './worker-test-harness';

export * from './download-external-asset';
export * from './interfaces';
export {
    JobTestHarness,
    SlicerTestHarness,
    WorkerTestHarness,
    newTestSlice,
    newTestJobConfig,
};

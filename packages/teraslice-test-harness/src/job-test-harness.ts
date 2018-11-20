import { DataEntity, JobConfig, Slice, RunSliceResult, SliceAnalyticsData, TestClientConfig } from '@terascope/job-components';
import SlicerTestHarness from './slicer-test-harness';
import WorkerTestHarness from './worker-test-harness';
import { JobHarnessOptions } from './interfaces';

/**
 * A Teraslice Test Harness for testing the interactions
 * between both the Slicer and the Worker operations.
 *
 * @todo Handle more than one worker?
*/
export default class JobTestHarness {
    private workerHarness: WorkerTestHarness;
    private slicerHarness: SlicerTestHarness;

    constructor(job: JobConfig, options: JobHarnessOptions) {
        this.workerHarness = new WorkerTestHarness(job, options);
        this.slicerHarness = new SlicerTestHarness(job, options);
    }

    get slicer() {
        return this.slicerHarness.slicer;
    }

    get fetcher() {
        return this.workerHarness.fetcher;
    }

    get processors() {
        return this.workerHarness.processors;
    }

    /**
     * Set the Terafoundation Clients on both
     * the Slicer and Worker contexts
    */
    async setClients(clients: TestClientConfig[]) {
        this.workerHarness.setClients(clients);
        this.slicerHarness.setClients(clients);
    }

    /**
     * Initialize the Operations in both of the Slicer
     * and Worker contexts.
     * @param recoveryData is an array of starting points to recover from
     * the retry data is only passed to slicer
    */
    async initialize(recoveryData?: object[]) {
        await this.slicerHarness.initialize(recoveryData);
        await this.workerHarness.initialize();
    }

    /**
     * Create a batch of slices in the Slicer context
     * and then run each slice on the Worker context
     * in series.
     * @returns batches of results
    */
    async run(): Promise<BatchedResults> {
        const slices = await this.slicerHarness.createSlices({ fullResponse: true }) as Slice[];

        const results: BatchedResults = [];

        for (const slice of slices) {
            this.slicerHarness.onSliceDispatch(slice);

            let analytics: SliceAnalyticsData = {
                time: [],
                size: [],
                memory: [],
            };

            try {
                const result = await this.workerHarness.runSlice(slice, { fullResponse: true }) as RunSliceResult;
                if (result.analytics) {
                    analytics = result.analytics;
                }
                results.push(result.results);
                this.slicerHarness.stats.slices.processed++;
            } catch (err) {
                this.slicerHarness.stats.slices.failed++;
                throw err;
            } finally {
                this.slicerHarness.onSliceComplete({
                    slice,
                    analytics
                });
            }
        }

        return results;
    }

    /**
     * Shutdown both the Worker and Slicer test harness
    */
    async shutdown() {
        await Promise.all([
            this.slicerHarness.shutdown(),
            this.workerHarness.shutdown(),
        ]);
    }
}

export type BatchedResults = DataEntity[][];

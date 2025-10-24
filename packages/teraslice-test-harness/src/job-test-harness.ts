import {
    JobConfigParams,
    Slice,
    RunSliceResult,
    SliceAnalyticsData,
    TestClientConfig,
    FetcherCore,
    SlicerCore,
    SlicerRecoveryData,
    pDelay,
    flatten,
} from '@terascope/job-components';
import { DataEntity } from '@terascope/entity-utils';
import SlicerTestHarness from './slicer-test-harness.js';
import WorkerTestHarness from './worker-test-harness.js';
import { JobHarnessOptions, SliceResults } from './interfaces.js';

/**
 * A test harness for both the Slicer and Fetcher,
 * utilizing both the Slicer and Worker test harnesses.
 *
 * This is useful for testing Readers.
 *
 * @todo Handle more than one worker?
*/

export default class JobTestHarness {
    readonly workerHarness: WorkerTestHarness;
    readonly slicerHarness: SlicerTestHarness;

    constructor(job: JobConfigParams, options: JobHarnessOptions) {
        this.workerHarness = new WorkerTestHarness(job, options);
        this.slicerHarness = new SlicerTestHarness(job, options);
    }

    slicer<T extends SlicerCore = SlicerCore>(): T {
        return this.slicerHarness.slicer<T>();
    }

    fetcher<T extends FetcherCore = FetcherCore>(): T {
        return this.workerHarness.fetcher<T>();
    }

    get processors(): WorkerTestHarness['processors'] {
        return this.workerHarness.processors;
    }

    get apis(): WorkerTestHarness['apis'] {
        return this.workerHarness.apis;
    }

    /**
     * Set the Terafoundation Clients on both
     * the Slicer and Worker contexts
    */
    async setClients(clients: TestClientConfig[]): Promise<void> {
        this.workerHarness.setClients(clients);
        this.slicerHarness.setClients(clients);
    }

    /**
     * Initialize the Operations in both of the Slicer
     * and Worker contexts.
     * @param recoveryData is an array of starting points to recover from
     * the retry data is only passed to slicer
    */
    async initialize(recoveryData?: SlicerRecoveryData[]): Promise<void> {
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
        const rawSlices = await this.slicerHarness.createSlices({ fullResponse: true }) as Slice[];
        const results: BatchedResults = [];

        for (const slice of rawSlices) {
            const sliceData = await this.processSlice(slice);
            results.push(...sliceData);
        }

        return results;
    }

    private async processSlice(slice: Slice): Promise<BatchedResults> {
        const results: BatchedResults = [];

        if (slice == null) return [null];
        this.slicerHarness.onSliceDispatch(slice);

        let analytics: SliceAnalyticsData = {
            time: [],
            size: [],
            memory: [],
        };

        try {
            const result = await this.workerHarness.runSlice(
                slice,
                { fullResponse: true }
            ) as RunSliceResult;

            if (result.analytics) {
                analytics = result.analytics;
            }
            results.push(result.results as DataList);
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

        return results;
    }

    /**
     * Gathers all slices from slicer and run them,
     *
     * @returns an array of objects containing the slice and the data the reader generated
    */
    async runToCompletion(): Promise<SliceResults[]> {
        const results: SliceResults[] = [];

        const allSlices = (await this.slicerHarness.getAllSlices({ fullResponse: true }))
            .filter(Boolean) as Slice[];

        for (const slice of allSlices) {
            const sliceData = await this.processSlice(slice);
            await pDelay(1);
            const dataLists = [...sliceData].filter(Boolean) as DataList[];
            const data = flatten<DataEntity>(dataLists);
            results.push({ slice, data });
        }

        return results;
    }

    /**
     * Shutdown both the Worker and Slicer test harness
    */
    async shutdown(): Promise<void> {
        await Promise.all([
            this.slicerHarness.shutdown(),
            this.workerHarness.shutdown(),
        ]);
    }
}

type DataList = DataEntity[];
export type BatchedResults = (DataList | null)[];

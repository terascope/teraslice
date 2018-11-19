import { DataEntity, JobConfig, Slice } from '@terascope/job-components';
import SlicerTestHarness from './slicer-test-harness';
import WorkerTestHarness from './worker-test-harness';
import { JobHarnessOptions, Client } from './interfaces';

/**
 * A Teraslice Test Harness for testing the interactions
 * between both the Slicer and the Worker operations.
 *
 * @todo Handle more than worker?
*/
export default class JobTestHarness {
    private worker: WorkerTestHarness;
    private slicer: SlicerTestHarness;

    constructor(job: JobConfig, options: JobHarnessOptions) {
        this.worker = new WorkerTestHarness(job, options);
        this.slicer = new SlicerTestHarness(job, options);
    }

    /**
     * Set the Terafoundation Clients on both
     * the Slicer and Worker contexts
    */
    async setClients(clients: Client[]) {
        this.worker.setClients(clients);
        this.slicer.setClients(clients);
    }

    /**
     * Initialize the Operations in both of the Slicer
     * and Worker contexts.
     * @param recoveryData is an array of starting points to recover from
     * the retry data is only passed to slicer
    */
    async initialize(recoveryData?: object[]) {
        await this.slicer.initialize(recoveryData);
        await this.worker.initialize();
    }

    /**
     * Create a batch of slices in the Slicer context
     * and then run each slice on the Worker context
     * in series.
     * @returns batches of results
    */
    async run(): Promise<BatchedResults> {
        const slices = await this.slicer.createSlices({ fullResponse: true }) as Slice[];

        const results: BatchedResults = [];

        for (const slice of slices) {
            const sliceResults = await this.worker.runSlice(slice) as DataEntity[];
            results.push(sliceResults);
        }

        return results;
    }

    /**
     * Shutdown both the Worker and Slicer test harness
    */
    async shutdown() {
        await Promise.all([
            this.slicer.shutdown(),
            this.worker.shutdown(),
        ]);
    }
}

export type BatchedResults = DataEntity[][];

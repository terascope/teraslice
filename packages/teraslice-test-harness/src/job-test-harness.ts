import { DataEntity, JobConfig, Slice } from '@terascope/job-components';
import SlicerTestHarness from './slicer-test-harness';
import WorkerTestHarness from './worker-test-harness';
import { JobHarnessOptions, Client } from './interfaces';

export default class JobTestHarness {
    private worker: WorkerTestHarness;
    private slicer: SlicerTestHarness;

    constructor(job: JobConfig, options: JobHarnessOptions) {
        this.worker = new WorkerTestHarness(job, options);
        this.slicer = new SlicerTestHarness(job, options);
    }

    async setClients(clients: Client[]) {
        this.worker.setClients(clients);
        this.slicer.setClients(clients);
    }

    async initialize(retryData?: []) {
        await this.slicer.initialize(retryData);
        await this.worker.initialize();
    }

    async run(): Promise<JobResults[]> {
        const slices = await this.slicer.createSlices({ fullResponse: true }) as Slice[];

        const results: JobResults[] = [];

        for (const slice of slices) {
            const sliceResults = await this.worker.runSlice(slice) as DataEntity[];
            results.push(sliceResults);
        }

        return results;
    }

    async shutdown() {
        await Promise.all([
            this.slicer.shutdown(),
            this.worker.shutdown(),
        ]);
    }
}

export type JobResults = DataEntity[];

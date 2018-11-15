import { sortBy, map, groupBy, times, set } from 'lodash';
import * as c from '@terascope/job-components';

export default class JobHarness {
    protected executionContext: c.WorkerExecutionContext|c.SlicerExecutionContext;
    protected context: c.WorkerContext|c.SlicerContext;

    private clients: Clients = {};

    constructor(job: c.JobConfig, options: JobHarnessOptions) {
        const context = new c.TestContext(`job-harness:${job.name}`);
        context.assignment = options.assignment || c.Assignment.Worker;

        const jobSchema = c.makeJobSchema(context);
        const executionConfig = c.validateJobConfig(jobSchema, job) as c.ExecutionConfig;
        this.executionContext = c.makeExecutionContext({
            context,
            executionConfig
        });
        this.context = this.executionContext.context;

        if (options.clients) {
            this.setClients(options.clients);
        }
    }

    async setClients(clients: Client[]) {
        clients.forEach((clientConfig) => {
            const { client, type, endpoint = 'default' } = clientConfig;

            if (!type || (typeof type !== 'string')) throw new Error('you must specify a type when setting a client');

            this.clients[`${type}:${endpoint}`] = client;
            set(this.context, ['sysconfig', 'terafoundation', 'connectors', type, endpoint], {});
        });

        this.context.apis.foundation.getConnection = this.getConnection.bind(this);
        this.context.foundation.getConnection = this.getConnection.bind(this);
    }

    async initialize() {
        this.clients = {};
        await this.executionContext.initialize();
    }

    async createSlices({ fullResponse = false } = {}): Promise<c.SliceRequest[]|c.Slice[]> {
        if (!c.isSlicerExecutionContext(this.executionContext)) {
            throwInvalidContext('createSlices', this.executionContext);
            return [];
        }

        const { slicer } = this.executionContext;
        const slicers = slicer.slicers();
        await slicer.handle();

        const slices = slicer.getSlices(10000);
        const sliceRequests = [];
        const slicesBySlicers = Object.values(groupBy(slices, 'slicer_id'));

        for (const perSlicer of slicesBySlicers) {
            const sorted = sortBy(perSlicer, 'slicer_order');
            if (fullResponse) {
                sliceRequests.push(...sorted);
            } else {
                const mapped = map(sorted, 'request');
                sliceRequests.push(...mapped);
            }
        }

        const remaining = slicers - sliceRequests.length;
        if (remaining > 0) {
            const nulls = times(remaining, () => null);
            return sliceRequests.concat(nulls);
        }

        return sliceRequests;
    }

    async runSlice(slice: c.Slice, { fullResponse = false } = {}): Promise<c.DataEntity[]|c.RunSliceResult> {
        if (!c.isWorkerExecutionContext(this.executionContext)) {
            throwInvalidContext('runSlice', this.executionContext);
            return [];
        }

        const result = await this.executionContext.runSlice(slice);
        if (fullResponse) {
            return result || {
                results: [],
            };
        }

        return result.results || [];
    }

    async cleanup() {
        return this.executionContext.shutdown();
    }

    private getConnection(config: c.GetClientConfig) {
        const { connection, endpoint } = config;
        const client = this.clients[`${connection}:${endpoint}`];
        if (!client) throw new Error(`No client was found at type ${connection}, endpoint: ${endpoint}`);
        return { client };
    }
}

function throwInvalidContext(method: string, context: c.WorkerExecutionContext|c.SlicerExecutionContext): never {
    const { assignment } = context.context;
    const expected = assignment === c.Assignment.Worker ? c.Assignment.ExecutionController : c.Assignment.Worker;
    const error = new Error(`${method} can only be run with assignment of "${expected}"`);
    Error.captureStackTrace(error, throwInvalidContext);
    throw error;
}

export interface JobHarnessOptions {
    assignment?: c.Assignment;
    assetDir: string;
    clients?: Client[];
}

export interface Client {
    type: string;
    client: any;
    endpoint?: string;
}

export interface Clients {
    [prop: string]: Client;
}

import { waterfall, isString, isInteger, cloneDeep, isFunction } from '../utils';
import { APICore, FetcherCore, ProcessorCore, OperationCore } from '../operations/core';
import { DataEntity, OperationAPI } from '../operations';
import { WorkerOperationLifeCycle, Slice } from '../interfaces';
import {
    ExecutionContextConfig,
    RunSliceResult,
} from './interfaces';
import JobObserver from '../operations/job-observer';
import BaseExecutionContext from './base';

/**
 * WorkerExecutionContext is designed to add more
 * functionality to interface with the
 * Execution Configuration and any Operation.
*/
export class WorkerExecutionContext extends BaseExecutionContext<WorkerOperationLifeCycle> implements WorkerOperationLifeCycle {
    readonly processors: ProcessorCore[];
    readonly apis: APICore[];

    private readonly jobObserver: JobObserver;

    private readonly _fetcher: FetcherCore;

    constructor(config: ExecutionContextConfig) {
        super(config);

        this._methodRegistry.set('onSliceInitialized', new Set());
        this._methodRegistry.set('onSliceStarted', new Set());
        this._methodRegistry.set('onSliceFinalizing', new Set());
        this._methodRegistry.set('onSliceFinished', new Set());
        this._methodRegistry.set('onSliceFailed', new Set());
        this._methodRegistry.set('onSliceRetry', new Set());
        this._methodRegistry.set('onOperationStart', new Set());
        this._methodRegistry.set('onOperationComplete', new Set());

        const readerConfig = this.config.operations[0];
        const mod = this._loader.loadReader(readerConfig._op, this.assetIds);
        this.registerAPI(readerConfig._op, mod.API);

        const op = new mod.Fetcher(this.context, cloneDeep(readerConfig), this.config);
        this._fetcher = op;
        this.addOperation(op);

        this.processors = [];

        for (const opConfig of this.config.operations.slice(1)) {
            const name = opConfig._op;
            const mod = this._loader.loadProcessor(name, this.assetIds);
            this.registerAPI(name, mod.API);

            const op = new mod.Processor(
                this.context,
                cloneDeep(opConfig),
                this.config
            );

            this.addOperation(op);
            this.processors.push(op);
        }

        const jobObserver = new JobObserver(this.context, {
            _name: 'job-observer'
        }, this.config);

        this.addOperation(jobObserver);
        this.jobObserver = jobObserver;

        this.apis = [];

        for (const apiConfig of this.config.apis || []) {
            const name = apiConfig._name;
            const mod = this._loader.loadAPI(name, this.assetIds);

            const api = new mod.API(
                this.context,
                cloneDeep(apiConfig),
                this.config
            );

            this.addOperation(api);
            this.apis.push(api);
        }
    }

    async initialize() {
        const promises = this.apis
            .filter(isOperationAPI)
            .map(async (api) => {
                await api.initialize();
                const opAPI = await api.createAPI();
                this.addAPI(api.apiConfig._name, opAPI);
            });

        await Promise.all(promises);

        await super.initialize();
    }

    /**
     * Get a operation by name or index.
     * If name is used it will return the first match.
    */
    getOperation<T extends OperationCore = OperationCore>(findBy: string|number): T {
        let index = -1;
        if (isString(findBy)) {
            index = this.config.operations.findIndex((op) => {
                return op._op === findBy;
            });
        } else if (isInteger(findBy) && findBy >= 0) {
            index = findBy;
        }

        if (index === 0) {
            // @ts-ignore
            return this._fetcher as T;
        }

        const processor = this.processors[index - 1];
        if (processor == null) {
            throw new Error(`Unable to find operation by ${findBy}`);
        }

        // @ts-ignore
        return processor as T;
    }

     /** The instance of a "Fetcher" */
    fetcher<T extends FetcherCore = FetcherCore>(): T {
        return this._fetcher as T;
    }

    /**
     * Run a slice against the fetcher and then processors.
     * TODO: this should handle slice retries.
    */
    async runSlice(slice: Slice): Promise<RunSliceResult> {
        const sliceId = slice.slice_id;
        const sliceRequest = cloneDeep(slice.request);

        const queue = [
            async (input: any) => {
                this.onOperationStart(sliceId, 0);
                const results = await this.fetcher().handle(input);
                this.onOperationComplete(sliceId, 0, results.length);
                return results;
            },
            async (input: any) => {
                await this.onSliceStarted(sliceId);
                return input;
            },
        ];

        let i = 0;
        for (const processor of this.processors) {
            const index = ++i;
            queue.push(async (input: any) => {
                this.onOperationStart(sliceId, index);
                const results = await processor.handle(input);
                this.onOperationComplete(sliceId, index, results.length);
                return results;
            });
        }

        const results = await waterfall(sliceRequest, queue) as DataEntity[];

        return {
            results,
            analytics: this.jobObserver.analyticsData,
        };
    }

    async onSliceInitialized(sliceId: string) {
        await this._runMethodAsync('onSliceInitialized', sliceId);
    }

    async onSliceStarted(sliceId: string) {
        await this._runMethodAsync('onSliceStarted', sliceId);
    }

    async onSliceFinalizing(sliceId: string) {
        await this._runMethodAsync('onSliceFinalizing', sliceId);
    }

    async onSliceFinished(sliceId: string) {
        await this._runMethodAsync('onSliceFinished', sliceId);
    }

    async onSliceFailed(sliceId: string) {
        await this._runMethodAsync('onSliceFailed', sliceId);
    }

    async onSliceRetry(sliceId: string) {
        await this._runMethodAsync('onSliceRetry', sliceId);
    }

    onOperationComplete(sliceId: string, index: number, processed: number) {
        this._runMethod('onOperationComplete', sliceId, index, processed);
    }

    onOperationStart(sliceId: string, index: number) {
        this._runMethod('onOperationStart', sliceId, index);
    }
}

function isOperationAPI(api: any): api is OperationAPI {
    return api && isFunction(api.createAPI);
}

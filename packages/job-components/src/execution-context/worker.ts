import { waterfall, isString, isInteger, cloneDeep, isFunction, DataEntity, isProd } from '@terascope/utils';
import { FetcherCore, ProcessorCore, OperationCore } from '../operations/core';
import { OperationAPI, OperationAPIConstructor } from '../operations';
import { WorkerOperationLifeCycle, Slice, OpAPI } from '../interfaces';
import { ExecutionContextConfig, RunSliceResult, JobAPIInstances, LastSliceResult } from './interfaces';
import JobObserver from '../operations/job-observer';
import BaseExecutionContext from './base';

/**
 * WorkerExecutionContext is designed to add more
 * functionality to interface with the
 * Execution Configuration and any Operation.
 */
export class WorkerExecutionContext extends BaseExecutionContext<WorkerOperationLifeCycle> implements WorkerOperationLifeCycle {
    readonly processors: ProcessorCore[];
    readonly apis: JobAPIInstances = {};

    private readonly jobObserver: JobObserver;
    private _last: LastSliceResult | undefined;

    private _sliceId: string | undefined;
    private readonly _fetcher: FetcherCore;
    private _queue: ((input: any) => Promise<DataEntity[]>)[];
    private _flushing = false;

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
        this._methodRegistry.set('beforeFlush', new Set());

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

            const op = new mod.Processor(this.context, cloneDeep(opConfig), this.config);

            this.addOperation(op);
            this.processors.push(op);
        }

        const jobObserver = new JobObserver(
            this.context,
            {
                _name: 'job-observer',
            },
            this.config
        );

        this.addOperation(jobObserver);
        this.jobObserver = jobObserver;

        for (const apiConfig of this.config.apis || []) {
            const name = apiConfig._name;
            const mod = this._loader.loadAPI(name, this.assetIds);

            const api = new mod.API(this.context, cloneDeep(apiConfig), this.config);

            this.apis[name] = {
                instance: api,
                type: mod.type,
            };
            this.addOperation(api);
        }

        this._queue = [
            async (input: any) => {
                this.onOperationStart(undefined, 0);
                if (this._flushing) {
                    this.onOperationComplete(undefined, 0, 0);
                    return [];
                }

                const results = await this.fetcher().handle(input);
                this.onOperationComplete(undefined, 0, results.length);
                return results;
            },
            async (input: any) => {
                await this.onSliceStarted();
                return input;
            },
        ];

        let i = 0;
        for (const processor of this.processors) {
            const index = ++i;

            this._queue.push(async (input: any) => {
                this.onOperationStart(undefined, index);
                const results = await processor.handle(input);
                this.onOperationComplete(undefined, index, results.length);
                return results;
            });
        }
    }

    async initialize() {
        await super.initialize();

        const promises = [];

        for (const [name, api] of Object.entries(this.apis)) {
            const { instance } = api;

            if (isOperationAPI(instance)) {
                promises.push(
                    (async () => {
                        const opAPI = await instance.createAPI();
                        api.opAPI = opAPI;

                        this.addAPI(name, opAPI);
                        this.apis[name] = api;
                    })()
                );
            }
        }

        await Promise.all(promises);
    }

    /**
     * Get a operation by name or index.
     * If name is used it will return the first match.
     */
    getOperation<T extends OperationCore = OperationCore>(findBy: string | number): T {
        let index = -1;
        if (isString(findBy)) {
            index = this.config.operations.findIndex(op => {
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
     *
     * @todo this should handle slice retries.
     */
    async runSlice(slice: Slice): Promise<RunSliceResult> {
        this._sliceId = slice.slice_id;
        this._setLast(slice);

        const results = await waterfall(cloneDeep(slice.request), this._queue, isProd);

        this._sliceId = undefined;
        this._setLast(slice);

        return {
            results,
            analytics: this.jobObserver.analyticsData,
        };
    }

    async flush() {
        this._flushing = true;
        if (!this._last) return;

        await this.beforeFlush();
        const { slice } = this._last;
        this._sliceId = slice.slice_id;

        await waterfall(cloneDeep(slice.request), this._queue, isProd);

        const analytics = this.jobObserver.getAnalytics();
        const ops = this.config.operations.length;

        for (const metric of Object.keys(analytics)) {
            for (let i = 0; i < ops; i++) {
                const current = this._last.analytics[i][metric];
                const updated = analytics[i][metric];
                this._last.analytics[i] = current + updated;
            }
        }

        this._flushing = false;
        return this._last;
    }

    async beforeFlush() {
        await this._runMethodAsync('beforeFlush');
    }

    async onSliceInitialized(sliceId = this._sliceId) {
        await this._runMethodAsync('onSliceInitialized', sliceId);
    }

    async onSliceStarted(sliceId = this._sliceId) {
        await this._runMethodAsync('onSliceStarted', sliceId);
    }

    async onSliceFinalizing(sliceId = this._sliceId) {
        await this._runMethodAsync('onSliceFinalizing', sliceId);
    }

    async onSliceFinished(sliceId = this._sliceId) {
        await this._runMethodAsync('onSliceFinished', sliceId);
    }

    async onSliceFailed(sliceId = this._sliceId) {
        await this._runMethodAsync('onSliceFailed', sliceId);
    }

    async onSliceRetry(sliceId = this._sliceId) {
        await this._runMethodAsync('onSliceRetry', sliceId);
    }

    onOperationComplete(sliceId = this._sliceId, index: number, processed: number) {
        this._runMethod('onOperationComplete', sliceId, index, processed);
    }

    onOperationStart(sliceId = this._sliceId, index: number) {
        this._runMethod('onOperationStart', sliceId, index);
    }

    /** Add an API to the executionContext api registry */
    protected registerAPI(name: string, API?: OperationAPIConstructor) {
        if (API == null) return;
        const { apis = [] } = this.config;
        const hasName = apis.some(({ _name }) => _name === name);
        if (hasName) {
            throw new Error(`Cannot register API ${name} due to conflict`);
        }

        this.context.apis.executionContext.addToRegistry(name, API);
    }

    /** Add an API to the executionContext api */
    protected addAPI(name: string, opAPI: OpAPI) {
        this.context.apis.executionContext.addAPI(name, opAPI);
    }

    private _setLast(slice: Slice) {
        return {
            slice,
            analytics: this.jobObserver.getAnalytics(),
        };
    }
}

function isOperationAPI(api: any): api is OperationAPI {
    return api && isFunction(api.createAPI);
}

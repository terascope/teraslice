import * as ts from '@terascope/utils';
import { FetcherCore, ProcessorCore, OperationCore } from '../operations/core';
import { OperationAPI, OperationAPIConstructor } from '../operations';
import { WorkerOperationLifeCycle, Slice, OpAPI, sliceAnalyticsMetrics } from '../interfaces';
import { ExecutionContextConfig, RunSliceResult, JobAPIInstances, WorkerSliceState, WorkerStatus, SliceStatus } from './interfaces';
import JobObserver from '../operations/job-observer';
import BaseExecutionContext from './base';

const _logger = ts.debugLogger('execution-context-worker');

/**
 * WorkerExecutionContext is designed to add more
 * functionality to interface with the
 * Execution Configuration and any Operation.
 */
export class WorkerExecutionContext extends BaseExecutionContext<WorkerOperationLifeCycle> implements WorkerOperationLifeCycle {
    readonly processors: ProcessorCore[];
    readonly apis: JobAPIInstances = {};

    private readonly jobObserver: JobObserver;

    readonly logger: ts.Logger;

    /** the active (or last) run slice */
    sliceState: WorkerSliceState | undefined;
    status: WorkerStatus = 'initializing';

    private readonly _fetcher: FetcherCore;
    private _queue: ((input: any) => Promise<ts.DataEntity[]>)[];

    constructor(config: ExecutionContextConfig, logger: ts.Logger = _logger) {
        super(config);
        this.logger = logger;

        this._methodRegistry.set('onSliceInitialized', new Set());
        this._methodRegistry.set('onSliceStarted', new Set());
        this._methodRegistry.set('onSliceFinalizing', new Set());
        this._methodRegistry.set('onSliceFinished', new Set());
        this._methodRegistry.set('onSliceFailed', new Set());
        this._methodRegistry.set('onSliceRetry', new Set());
        this._methodRegistry.set('onOperationStart', new Set());
        this._methodRegistry.set('onOperationComplete', new Set());
        this._methodRegistry.set('beforeFlush', new Set());
        this._methodRegistry.set('afterFlush', new Set());

        const readerConfig = this.config.operations[0];
        const mod = this._loader.loadReader(readerConfig._op, this.assetIds);
        this.registerAPI(readerConfig._op, mod.API);

        const op = new mod.Fetcher(this.context, ts.cloneDeep(readerConfig), this.config);
        this._fetcher = op;
        this.addOperation(op);

        this.processors = [];

        for (const opConfig of this.config.operations.slice(1)) {
            const name = opConfig._op;
            const mod = this._loader.loadProcessor(name, this.assetIds);
            this.registerAPI(name, mod.API);

            const op = new mod.Processor(this.context, ts.cloneDeep(opConfig), this.config);

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

            const api = new mod.API(this.context, ts.cloneDeep(apiConfig), this.config);

            this.apis[name] = {
                instance: api,
                type: mod.type,
            };
            this.addOperation(api);
        }

        this._queue = [
            async (input: any) => {
                this._onOperationStart(0);
                if (this.status === 'flushing') {
                    this._onOperationComplete(0, 0);
                    return [];
                }

                const results = await this.fetcher().handle(input);
                this._onOperationComplete(0, results.length);
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
                this._onOperationStart(index);
                const results = await processor.handle(input);
                this._onOperationComplete(index, results.length);
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

        this.status = 'idle';
    }

    async shutdown() {
        await super.shutdown();
        this.status = 'shutdown';
    }

    /**
     * Get a operation by name or index.
     * If name is used it will return the first match.
     */
    getOperation<T extends OperationCore = OperationCore>(findBy: string | number): T {
        let index = -1;
        if (ts.isString(findBy)) {
            index = this.config.operations.findIndex(op => {
                return op._op === findBy;
            });
        } else if (ts.isInteger(findBy) && findBy >= 0) {
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

    async initializeSlice(slice: Slice) {
        const currentSliceId = this._sliceId;
        if (this.status !== 'flushing') {
            this.status = 'running';
        }

        this.sliceState = {
            status: 'starting',
            slice,
        };

        if (currentSliceId === slice.slice_id) return;
        this.onSliceInitialized();
    }

    /**
     * Run a slice against the fetcher and then processors.
     *
     * @todo this should handle slice retries.
     */
    async runSlice(slice?: Slice): Promise<RunSliceResult> {
        if (slice) {
            await this.initializeSlice(slice);
        }

        if (!this.sliceState) {
            throw new Error('No slice specified to run');
        }

        const maxRetries = this.config.max_retries;
        const maxTries = maxRetries > 0 ? maxRetries + 1 : 0;
        const retryOptions = {
            retries: maxTries,
            delay: 100,
        };

        let remaining = maxTries;
        return ts.pRetry(() => {
            remaining -= 1;
            return this._runActiveSlice(remaining > 0);
        }, retryOptions);
    }

    async flush(): Promise<RunSliceResult | undefined> {
        if (!this.sliceState) return;
        if (this.sliceState.status === 'failed') return;
        if (this.status === 'shutdown') return;

        this.status = 'flushing';
        await this.beforeFlush();
        const skip: SliceStatus[] = ['started', 'starting'];
        if (skip.includes(this.sliceState.status)) return;

        return this._runActiveSlice(false);
    }

    async beforeFlush() {
        await this._runMethodAsync('beforeFlush');
    }

    async afterFlush() {
        await this._runMethodAsync('afterFlush');
    }

    async onSliceInitialized() {
        this.events.emit('slice:initialize', this._slice);
        await this._runMethodAsync('onSliceInitialized', this._sliceId);
    }

    async onSliceStarted() {
        this._updateActive('started');
        await this._runMethodAsync('onSliceStarted', this._sliceId);
    }

    async onSliceFinalizing() {
        this.events.emit('slice:finalize', this._slice);
        await this._runMethodAsync('onSliceFinalizing', this._sliceId);
    }

    async onSliceFinished() {
        this.status = 'idle';
        await this._runMethodAsync('onSliceFinished', this._sliceId);
    }

    async onSliceFailed() {
        this._updateActive('failed');
        this.events.emit('slice:failure', this._slice);
        await this._runMethodAsync('onSliceFailed', this._sliceId);
    }

    async onSliceRetry() {
        this.events.emit('slice:retry', this._slice);
        await this._runMethodAsync('onSliceRetry', this._sliceId);
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

    private _onOperationComplete(index: number, processed: number) {
        this._runMethod('onOperationComplete', this._sliceId, index, processed);
    }

    private _onOperationStart(index: number) {
        this._runMethod('onOperationStart', this._sliceId, index);
    }

    private _updateActive(status: SliceStatus) {
        if (!this.sliceState) throw new Error('No active slice to update');
        this.sliceState.status = status;

        if (status === 'completed') {
            this.sliceState.analytics = this.jobObserver.getAnalytics();
            return;
        }

        if (status === 'flushed') {
            const analytics = this.jobObserver.getAnalytics();
            if (!this.sliceState.analytics || !analytics) return;

            const ops = this.config.operations.length;

            for (const metric of sliceAnalyticsMetrics) {
                for (let i = 0; i < ops; i++) {
                    const previous = getMetric(this.sliceState.analytics[metric], i);
                    const current = getMetric(analytics[metric], i);
                    const updated = previous + current;
                    analytics[metric][i] = updated;
                }
            }

            this.sliceState.analytics = analytics;
        }
    }

    private async _runActiveSlice(shouldRetry: boolean): Promise<RunSliceResult> {
        if (!this.sliceState) throw new Error('No active slice to run');
        if (this.status === 'shutdown') {
            throw new ts.TSError('Slice shutdown during slice execution', {
                retryable: false,
            });
        }

        try {
            const request = ts.cloneDeep(this.sliceState.slice.request);
            const results: ts.DataEntity[] = await ts.waterfall(request, this._queue, ts.isProd);
            if (this.status === 'flushing') {
                this._updateActive('flushed');
                this.afterFlush();
            } else {
                this._updateActive('completed');
            }
            return {
                results,
                status: this.sliceState.status,
                analytics: this.sliceState.analytics,
            };
        } catch (err) {
            this.logger.error(`An error has occurred: ${ts.toString(err)}, slice:`, this.sliceState.slice);

            if (shouldRetry) {
                try {
                    await this.onSliceRetry();
                } catch (retryErr) {
                    throw new ts.TSError(err, {
                        reason: `Slice failed to retry: ${ts.toString(retryErr)}`,
                        retryable: false,
                    });
                }
            }

            this._updateActive('failed');
            throw err;
        }
    }

    private get _sliceId(): string {
        return this.sliceState ? this.sliceState.slice.slice_id : '';
    }

    private get _slice() {
        return this.sliceState && this.sliceState.slice;
    }
}

function getMetric(input: number[], i: number): number {
    const val = input && input[i];
    if (val > 0) return val;
    return 0;
}

function isOperationAPI(api: any): api is OperationAPI {
    return api && ts.isFunction(api.createAPI);
}

import * as ts from '@terascope/utils';
import { ExecutionContextConfig, RunSliceResult, WorkerSliceState, WorkerStatus, SliceStatus } from './interfaces';
import { WorkerOperationLifeCycle, Slice, sliceAnalyticsMetrics, SliceAnalyticsData } from '../interfaces';
import { FetcherCore, ProcessorCore, OperationCore } from '../operations/core';
import JobObserver from '../operations/job-observer';
import BaseExecutionContext from './base';
import { getMetric } from './utils';

/**
 * WorkerExecutionContext is designed to add more
 * functionality to interface with the
 * Execution Configuration and any Operation.
 */
export class WorkerExecutionContext extends BaseExecutionContext<WorkerOperationLifeCycle> implements WorkerOperationLifeCycle {
    readonly processors: ProcessorCore[];
    readonly logger: ts.Logger;

    /** the active (or last) run slice */
    sliceState: WorkerSliceState | undefined;
    status: WorkerStatus = 'initializing';

    private readonly _fetcher: FetcherCore;
    private _queue: ((input: any) => Promise<ts.DataEntity[]>)[];

    constructor(config: ExecutionContextConfig) {
        super(config);
        this.logger = this.api.makeLogger('worker_context');

        this._methodRegistry.set('onSliceInitialized', new Set());
        this._methodRegistry.set('onSliceStarted', new Set());
        this._methodRegistry.set('onSliceFinalizing', new Set());
        this._methodRegistry.set('onSliceFinished', new Set());
        this._methodRegistry.set('onSliceFailed', new Set());
        this._methodRegistry.set('onSliceRetry', new Set());
        this._methodRegistry.set('onOperationStart', new Set());
        this._methodRegistry.set('onOperationComplete', new Set());
        this._methodRegistry.set('onFlushStart', new Set());
        this._methodRegistry.set('onFlushEnd', new Set());

        // register the job-observer first
        this.api.addToRegistry('job-observer', JobObserver);

        // then register the apis specified in config.apis
        for (const apiConfig of this.config.apis || []) {
            const name = apiConfig._name;
            const apiMod = this._loader.loadAPI(name, this.assetIds);

            this.api.addToRegistry(name, apiMod.API);
        }

        // then register an api associated to a Reader
        const [readerConfig, ...processorConfigs] = this.config.operations;
        const readerMod = this._loader.loadReader(readerConfig._op, this.assetIds);
        if (readerMod.API) {
            this.api.addToRegistry(readerConfig._op, readerMod.API);
        }

        // then register any apis associated to the processors
        this.processors = [];

        for (const opConfig of processorConfigs) {
            const name = opConfig._op;
            const pMod = this._loader.loadProcessor(name, this.assetIds);
            if (pMod.API) {
                this.api.addToRegistry(name, pMod.API);
            }

            const pOp = new pMod.Processor(this.context, ts.cloneDeep(opConfig), this.config);
            this.processors.push(pOp);
        }

        // Then add the processors / readers
        const op = new readerMod.Fetcher(this.context, ts.cloneDeep(readerConfig), this.config);
        this._fetcher = op;
        this.addOperation(op);
        for (const pOp of this.processors) {
            this.addOperation(pOp);
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

        // make sure we autoload the api
        const promises: Promise<any>[] = [];
        for (const { _name: name } of this.config.apis || []) {
            const api = this.apis[name];
            if (api.type === 'api') {
                promises.push(this.api.initAPI(name));
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
            index = findBy as number;
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

    get apis() {
        return this.api.apis;
    }

    get jobObserver(): JobObserver {
        const jobObserver = this.api.getObserver<JobObserver>('job-observer');
        if (jobObserver == null) throw new Error("Job Observer hasn't not be initialized");
        return jobObserver;
    }

    async initializeSlice(slice: Slice) {
        const currentSliceId = this._sliceId;
        if (this.status !== 'flushing') {
            this.status = 'running';
        }

        this.sliceState = {
            status: 'starting',
            position: -1,
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
        if (slice) await this.initializeSlice(slice);
        if (!this.sliceState) throw new Error('No slice specified to run');

        const maxRetries = this.config.max_retries;
        const maxTries = maxRetries > 0 ? maxRetries + 1 : 0;
        const retryOptions = {
            retries: maxTries,
            delay: 100,
        };

        let remaining = maxTries;
        return ts.pRetry(() => {
            remaining--;
            return this._runSliceOnce(remaining > 0);
        }, retryOptions);
    }

    async flush(): Promise<RunSliceResult | undefined> {
        if (!this.sliceState) return;
        if (this.sliceState.status === 'failed') return;
        if (this.status === 'shutdown') return;

        await this.onFlushStart();

        const { position } = this.sliceState;

        if (position < 1) {
            this.logger.info(`flushing the currently running slice ${this._sliceId}`);
            return;
        }

        if (this.processingSlice) {
            this.logger.info(`waiting until slice ${this._sliceId} is finished before flushing`, { position });

            const workerShutdown = ts.get(this.context, 'sysconfig.teraslice.shutdown_timeout', 60000);
            const timeoutMs = Math.round(workerShutdown * 0.8);

            await new Promise(resolve => {
                const startTime = Date.now();
                const interval = setInterval(() => {
                    if (!this.processingSlice) {
                        clearTimeout(interval);
                        return resolve();
                    }

                    const elapsed = Date.now() - startTime;
                    if (elapsed >= timeoutMs) {
                        this.logger.error(
                            new ts.TSError('Timeout waiting for slice to finish before flushing', {
                                context: {
                                    start: new Date(startTime),
                                    timeoutMs,
                                    sliceState: this.sliceState,
                                },
                            })
                        );

                        clearTimeout(interval);
                        return resolve();
                    }
                }, 10);
            });
        }

        this.logger.info(`flushing slice ${this._sliceId}`);
        return this._runSliceOnce(false);
    }

    get processingSlice(): boolean {
        if (!this.sliceState) return false;
        return ['started', 'starting'].includes(this.sliceState.status);
    }

    async onFlushStart() {
        this.status = 'flushing';
        this.events.emit('slice:flush:start', this._slice);
        await this._runMethodAsync('onFlushStart');
    }

    async onFlushEnd() {
        this.events.emit('slice:flush:end', this._slice);
        await this._runMethodAsync('onFlushEnd');
    }

    async onSliceInitialized() {
        this.events.emit('slice:initialize', this._slice);
        await this._runMethodAsync('onSliceInitialized', this._sliceId);
    }

    async onSliceStarted() {
        this._updateSliceState('started');
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
        this._updateSliceState('failed');
        this.events.emit('slice:failure', this._slice);
        await this._runMethodAsync('onSliceFailed', this._sliceId);
    }

    async onSliceRetry() {
        this.events.emit('slice:retry', this._slice);
        await this._runMethodAsync('onSliceRetry', this._sliceId);
    }

    private _onOperationComplete(index: number, processed: number) {
        this._runMethod('onOperationComplete', this._sliceId, index, processed);
    }

    private _onOperationStart(index: number) {
        if (this.sliceState) {
            this.sliceState.position = index;
        }
        this._runMethod('onOperationStart', this._sliceId, index);
    }

    private _updateSliceState(status: SliceStatus) {
        if (!this.sliceState) throw new Error('No active slice to update');

        this.sliceState.status = status;

        if (status === 'completed') {
            this.sliceState.analytics = this.jobObserver.getAnalytics();
            return;
        }

        if (status === 'flushed') {
            this.sliceState.analytics = this._mergeAnalytics();
            return;
        }
    }

    private async _runSliceOnce(shouldRetry: boolean): Promise<RunSliceResult> {
        if (!this.sliceState) throw new Error('No active slice to run');
        if (this.status === 'shutdown') {
            throw new ts.TSError('Slice shutdown during slice execution', {
                retryable: false,
            });
        }

        if (this.status !== 'flushing') {
            this.status = 'running';
        }

        try {
            const request = ts.cloneDeep(this.sliceState.slice.request);
            const results: ts.DataEntity[] = await ts.waterfall(request, this._queue, ts.isProd);

            if (this.status === 'flushing') {
                this._updateSliceState('flushed');
                this.onFlushEnd();
            } else {
                this._updateSliceState('completed');
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

            this._updateSliceState('failed');
            throw err;
        }
    }

    private _mergeAnalytics(): SliceAnalyticsData | undefined {
        const analytics = this.jobObserver.getAnalytics();
        if (!analytics) return;

        const sliceState = this.sliceState!;
        const ops = this.config.operations.length;
        const hasPrevious = sliceState.analytics != null;
        const previous = sliceState.analytics || this.jobObserver.defaultAnalytics();

        for (const metric of sliceAnalyticsMetrics) {
            for (let i = 0; i < ops; i++) {
                const previousMetric = getMetric(previous[metric], i);
                const currentMetric = getMetric(analytics[metric], i);

                if (hasPrevious && metric === 'size' && currentMetric > previousMetric) {
                    const opName = this.config.operations[i]._op;
                    const diff = currentMetric - previousMetric;
                    this.logger.info(`operation "${opName}" flushed an additional ${diff} records`);
                }

                const updated = previousMetric + currentMetric;
                analytics[metric][i] = updated;
            }
        }

        return analytics;
    }

    private get _sliceId(): string {
        return this.sliceState ? this.sliceState.slice.slice_id : '';
    }

    private get _slice() {
        return this.sliceState && this.sliceState.slice;
    }
}

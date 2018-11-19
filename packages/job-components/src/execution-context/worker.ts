import { EventEmitter } from 'events';
import cloneDeep from 'lodash.clonedeep';
import { enumerable, isFunction, waterfall } from '../utils';
import { OperationLoader } from '../operation-loader';
import FetcherCore from '../operations/core/fetcher-core';
import ProcessorCore from '../operations/core/processor-core';
import { OperationAPIConstructor, DataEntity } from '../operations';
import { registerApis } from '../register-apis';
import { WorkerOperationLifeCycle, ExecutionConfig, Slice } from '../interfaces';
import {
    EventHandlers,
    WorkerOperations,
    WorkerContext,
    ExecutionContextConfig,
    WorkerMethodRegistry,
    RunSliceResult,
} from './interfaces';
import JobObserver from '../operations/job-observer';

// WeakMaps are used as a memory efficient reference to private data
const _loaders = new WeakMap<WorkerExecutionContext, OperationLoader>();
const _operations = new WeakMap<WorkerExecutionContext, WorkerOperations>();

/**
 * WorkerExecutionContext is designed to add more
 * functionality to interface with the
 * Execution Configuration and any Operation.
*/
export class WorkerExecutionContext implements WorkerOperationLifeCycle {
    readonly config: ExecutionConfig;
    readonly context: WorkerContext;

    /**
     * A list of assetIds available to the job.
     * This will be replaced by `resolvedAssets`
    */
    readonly assetIds: string[] = [];

    /** The instance of a "Fetcher" */
    readonly fetcher: FetcherCore;

    /**
     * A Set of a Processors available to Job.
     * This does not include the Fetcher since they have
     * different APIs.
    */
    readonly processors: Set<ProcessorCore>;

    readonly exId: string;
    readonly jobId: string;

    /** The terafoundation EventEmitter */
    readonly events: EventEmitter;

    private readonly jobObserver: JobObserver;

    private _handlers: EventHandlers = {};

    private _methodRegistry: WorkerMethodRegistry = {
        onSliceInitialized: new Set(),
        onSliceStarted: new Set(),
        onSliceFinalizing: new Set(),
        onSliceFinished: new Set(),
        onSliceFailed: new Set(),
        onSliceRetry: new Set(),
        onOperationStart: new Set(),
        onOperationComplete: new Set(),
    };

    constructor(config: ExecutionContextConfig) {
        this.events = config.context.apis.foundation.getSystemEvents();

        this._handlers['execution:add-to-lifecycle'] = (op: WorkerOperationLifeCycle) => {
            this.addOperation(op);
        };

        this.events.on('execution:add-to-lifecycle', this._handlers['execution:add-to-lifecycle']);

        const executionConfig = cloneDeep(config.executionConfig);
        const loader = new OperationLoader({
            terasliceOpPath: config.terasliceOpPath,
            assetPath: config.context.sysconfig.teraslice.assets_directory,
        });

        registerApis(config.context, executionConfig);
        this.context = config.context as WorkerContext;

        this.assetIds = config.assetIds || [];

        this.config = executionConfig;
        this.exId = executionConfig.ex_id;
        this.jobId = executionConfig.job_id;

        _loaders.set(this, loader);

        _operations.set(this, new Set());

        const readerConfig = this.config.operations[0];
        const mod = loader.loadReader(readerConfig._op, this.assetIds);
        this.registerAPI(readerConfig._op, mod.API);

        const op = new mod.Fetcher(this.context, cloneDeep(readerConfig), this.config);
        this.fetcher = op;
        this.addOperation(op);

        this.processors = new Set();

        for (const opConfig of this.config.operations.slice(1)) {
            const name = opConfig._op;
            const mod = loader.loadProcessor(name, this.assetIds);
            this.registerAPI(name, mod.API);

            const op = new mod.Processor(this.context, cloneDeep(opConfig), this.config);
            this.addOperation(op);
            this.processors.add(op);
        }

        const jobObserver = new JobObserver(this.context, this.config);
        this.addOperation(jobObserver);
        this.jobObserver = jobObserver;
    }

    /**
     * Called to initialize all of the registered operations available to the Worker
    */
    async initialize() {
        const promises = [];
        for (const op of this.getOperations()) {
            promises.push(op.initialize());
        }

        await Promise.all(promises);
    }

    /**
     * Called to cleanup all of the registered operations available to the Worker
    */
    async shutdown() {
        const promises = [];
        for (const op of this.getOperations()) {
            promises.push(op.shutdown());
        }

        await Promise.all(promises);

        Object.keys(this._handlers)
            .forEach((event) => {
                const listener = this._handlers[event];
                this.events.removeListener(event, listener);
            });
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
                const results = await this.fetcher.handle(input);
                this.onOperationComplete(sliceId, 0, results.length);
                return results;
            },
            async (input: any) => {
                await this.onSliceStarted(sliceId);
                return input;
            },
        ];

        let i = 0;
        for (const processor of this.processors.values()) {
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
        await this.runMethodAsync('onSliceInitialized', sliceId);
    }

    async onSliceStarted(sliceId: string) {
        await this.runMethodAsync('onSliceStarted', sliceId);
    }

    async onSliceFinalizing(sliceId: string) {
        await this.runMethodAsync('onSliceFinalizing', sliceId);
    }

    async onSliceFinished(sliceId: string) {
        await this.runMethodAsync('onSliceFinished', sliceId);
    }

    async onSliceFailed(sliceId: string) {
        await this.runMethodAsync('onSliceFailed', sliceId);
    }

    async onSliceRetry(sliceId: string) {
        await this.runMethodAsync('onSliceRetry', sliceId);
    }

    onOperationComplete(sliceId: string, index: number, processed: number) {
        this.runMethod('onOperationComplete', sliceId, index, processed);
    }

    onOperationStart(sliceId: string, index: number) {
        this.runMethod('onOperationStart', sliceId, index);
    }

    /**
     * Returns a list of any registered Operation that has been
     * initialized.
    */
    getOperations() {
        const ops = _operations.get(this) as WorkerOperations;
        return ops.values();
    }

    private addOperation(op: WorkerOperationLifeCycle) {
        const ops = _operations.get(this) as WorkerOperations;
        ops.add(op);

        this.resetMethodRegistry();
    }

    private registerAPI(name: string, API?: OperationAPIConstructor) {
        if (API == null) return;

        this.context.apis.executionContext.addToRegistry(name, API);
    }

    private runMethodAsync(method: string, sliceId: string) {
        const set = this._methodRegistry[method] as Set<number>;
        if (set.size === 0) return;

        let i = 0;
        const promises = [];
        for (const operation of this.getOperations()) {
            const index = i++;
            if (set.has(index)) {
                promises.push(operation[method](sliceId));
            }
        }

        return Promise.all(promises);
    }

    private runMethod(method: string, ...args: any[]) {
        const set = this._methodRegistry[method] as Set<number>;
        if (set.size === 0) return;

        let index = 0;
        for (const operation of this.getOperations()) {
            if (set.has(index)) {
                operation[method](...args);
            }
            index++;
        }
    }

    private resetMethodRegistry() {
        for (const method of Object.keys(this._methodRegistry)) {
            this._methodRegistry[method].clear();
        }

        const methods = Object.keys(this._methodRegistry);

        let index = 0;
        for (const op of this.getOperations()) {
            for (const method of methods) {
                if (isFunction(op[method])) {
                    this._methodRegistry[method].add(index);
                }
            }

            index++;
        }
    }
}

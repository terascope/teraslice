import { EventEmitter } from 'events';
import cloneDeep from 'lodash.clonedeep';
import { enumerable } from '../utils';
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

    private readonly jobObserver: JobObserver;

    /** The terafoundation EventEmitter */
    private events: EventEmitter;
    private _handlers: EventHandlers = {};

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
    @enumerable(false)
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
    @enumerable(false)
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
    async runSlice(slice: Slice) {
        const sliceId = slice.slice_id;

        let index = 0;
        let result = await this.fetcher.handle(cloneDeep(slice.request));
        this.onOperationComplete(index, sliceId, result.length);

        await this.onSliceStarted(sliceId);

        for (const processor of this.processors.values()) {
            index++;
            result = await processor.handle(result);
            this.onOperationComplete(index, sliceId, result.length);
        }

        return {
            results: DataEntity.listToJSON(result),
            analytics: this.jobObserver.analyticsData,
        };
    }

    @enumerable(false)
    async onSliceInitialized(sliceId: string) {
        const promises = [];
        for (const operation of this.getOperations()) {
            promises.push(operation.onSliceInitialized(sliceId));
        }

        await Promise.all(promises);
    }

    @enumerable(false)
    async onSliceStarted(sliceId: string) {
        const promises = [];
        for (const operation of this.getOperations()) {
            promises.push(operation.onSliceStarted(sliceId));
        }

        await Promise.all(promises);
    }

    @enumerable(false)
    async onSliceFinalizing(sliceId: string) {
        const promises = [];
        for (const operation of this.getOperations()) {
            promises.push(operation.onSliceFinalizing(sliceId));
        }

        await Promise.all(promises);
    }

    @enumerable(false)
    async onSliceFinished(sliceId: string) {
        const promises = [];
        for (const operation of this.getOperations()) {
            promises.push(operation.onSliceFinished(sliceId));
        }

        await Promise.all(promises);
    }

    @enumerable(false)
    async onSliceFailed(sliceId: string) {
        const promises = [];
        for (const operation of this.getOperations()) {
            promises.push(operation.onSliceFailed(sliceId));
        }

        await Promise.all(promises);
    }

    @enumerable(false)
    async onSliceRetry(sliceId: string) {
        const promises = [];
        for (const operation of this.getOperations()) {
            promises.push(operation.onSliceRetry(sliceId));
        }

        await Promise.all(promises);
    }

    onOperationComplete(index: number, sliceId: string, processed: number) {
        for (const operation of this.getOperations()) {
            if (operation.onOperationComplete != null) {
                operation.onOperationComplete(index, sliceId, processed);
            }
        }
    }

    /**
     * Returns a list of any registered Operation that has been
     * initialized.
    */
    @enumerable(false)
    getOperations() {
        const ops = _operations.get(this) as WorkerOperations;
        return ops.values();
    }

    @enumerable(false)
    private addOperation(op: WorkerOperationLifeCycle) {
        const ops = _operations.get(this) as WorkerOperations;
        ops.add(op);
    }

    @enumerable(false)
    private registerAPI(name: string, API?: OperationAPIConstructor) {
        if (API == null) return;

        this.context.apis.executionContext.addToRegistry(name, API);
    }
}

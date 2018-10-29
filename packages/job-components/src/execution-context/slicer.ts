import { EventEmitter } from 'events';
import cloneDeep from 'lodash.clonedeep';
import { enumerable, isFunction } from '../utils';
import {
    SlicerOperationLifeCycle,
    ExecutionConfig,
    ExecutionStats,
    Slice,
    SliceResult,
} from '../interfaces';
import { OperationLoader } from '../operation-loader';
import SlicerCore from '../operations/core/slicer-core';
import { registerApis } from '../register-apis';
import {
    EventHandlers,
    SlicerContext,
    SlicerOperations,
    ExecutionContextConfig,
    SlicerMethodRegistry,
} from './interfaces';

// WeakMaps are used as a memory efficient reference to private data
const _loaders = new WeakMap<SlicerExecutionContext, OperationLoader>();
const _operations = new WeakMap<SlicerExecutionContext, SlicerOperations>();

/**
 * SlicerExecutionContext is designed to add more
 * functionality to interface with the
 * Execution Configuration and any Operation.
*/
export class SlicerExecutionContext implements SlicerOperationLifeCycle {
    readonly config: ExecutionConfig;
    readonly context: SlicerContext;

    /**
     * A list of assetIds available to the job.
     * This will be replaced by `resolvedAssets`
    */
    readonly assetIds: string[] = [];

    /** The instance of a "Slicer" */
    readonly slicer: SlicerCore;

    readonly exId: string;
    readonly jobId: string;

    /** The terafoundation EventEmitter */
    private events: EventEmitter;
    private _handlers: EventHandlers = {};

    private _methodRegistry: SlicerMethodRegistry = {
        onSliceComplete: new Set(),
        onSliceDispatch: new Set(),
        onSliceEnqueued: new Set(),
        onExecutionStats: new Set(),
    };

    constructor(config: ExecutionContextConfig) {
        this.events = config.context.apis.foundation.getSystemEvents();

        this._handlers['execution:add-to-lifecycle'] = (op: SlicerOperationLifeCycle) => {
            this.addOperation(op);
        };

        this.events.on('execution:add-to-lifecycle', this._handlers['execution:add-to-lifecycle']);

        const executionConfig = cloneDeep(config.executionConfig);
        const loader = new OperationLoader({
            terasliceOpPath: config.terasliceOpPath,
            assetPath: config.context.sysconfig.teraslice.assets_directory,
        });

        registerApis(config.context, executionConfig);
        this.context = config.context as SlicerContext;

        this.assetIds = config.assetIds || [];

        this.config = executionConfig;
        this.exId = executionConfig.ex_id;
        this.jobId = executionConfig.job_id;

        _loaders.set(this, loader);

        _operations.set(this, new Set());

        const readerConfig = this.config.operations[0];
        const mod = loader.loadReader(readerConfig._op, this.assetIds);

        const op = new mod.Slicer(this.context, cloneDeep(readerConfig), this.config);
        this.slicer = op;
        this.addOperation(op);

        this.resetMethodRegistry();
    }

    /**
     * Called to initialize all of the registered operations available to the Execution Controller
    */
    @enumerable(false)
    async initialize(recoveryData: object[] = []) {
        const promises = [];
        for (const op of this.getOperations()) {
            promises.push(op.initialize(recoveryData));
        }

        await Promise.all(promises);
    }

    /**
     * Called to cleanup all of the registered operations available to the Execution Controller
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

    @enumerable(false)
    onExecutionStats(stats: ExecutionStats) {
        this.runMethod('onExecutionStats', stats);
    }

    @enumerable(false)
    onSliceEnqueued(slice: Slice) {
        this.runMethod('onSliceEnqueued', slice);
    }

    @enumerable(false)
    onSliceDispatch(slice: Slice) {
        this.runMethod('onSliceDispatch', slice);
    }

    @enumerable(false)
    onSliceComplete(result: SliceResult): void {
        this.runMethod('onSliceComplete', result);
    }

    @enumerable(false)
    getOperations() {
        const ops = _operations.get(this) as SlicerOperations;
        return ops.values();
    }

    @enumerable(false)
    private addOperation(op: SlicerOperationLifeCycle) {
        const ops = _operations.get(this) as SlicerOperations;
        ops.add(op);

        this.resetMethodRegistry();
    }

    @enumerable(false)
    private runMethod<T>(method: string, arg: T) {
        const set = this._methodRegistry[method] as Set<number>;
        if (set.size === 0) return;

        let index = 0;
        for (const operation of this.getOperations()) {
            if (set.has(index)) {
                operation[method](arg);
            }
            index++;
        }
    }

    @enumerable(false)
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

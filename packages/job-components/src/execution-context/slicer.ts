import { EventEmitter } from 'events';
import cloneDeep from 'lodash.clonedeep';
import { enumerable } from '../utils';
import {
    SlicerOperationLifeCycle,
    ExecutionConfig,
    ExecutionStats,
    Slice,
    SliceResult
} from '../interfaces';
import { OperationLoader } from '../operation-loader';
import SlicerCore from '../operations/core/slicer-core';
import { registerApis } from '../register-apis';
import {
    EventHandlers,
    SlicerContext,
    SlicerOperations,
    ExecutionContextConfig
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

        const op = new mod.Slicer(this.context, readerConfig, this.config);
        this.slicer = op;
        this.addOperation(op);
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

        // for backwards compatibility
        this.events.emit('worker:shutdown');

        await Promise.all(promises);

        Object.keys(this._handlers)
            .forEach((event) => {
                const listener = this._handlers[event];
                this.events.removeListener(event, listener);
            });
    }

    @enumerable(false)
    onExecutionStats(stats: ExecutionStats) {
        for (const operation of this.getOperations()) {
            operation.onExecutionStats(stats);
        }
    }

    @enumerable(false)
    onSliceEnqueued(slice: Slice) {
        for (const operation of this.getOperations()) {
            operation.onSliceEnqueued(slice);
        }
    }

    @enumerable(false)
    onSliceDispatch(slice: Slice) {
        for (const operation of this.getOperations()) {
            operation.onSliceDispatch(slice);
        }
    }

    @enumerable(false)
    onSliceComplete(result: SliceResult): void {
        for (const operation of this.getOperations()) {
            operation.onSliceComplete(result);
        }
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
    }
}

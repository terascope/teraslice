import { EventEmitter } from 'events';
import cloneDeep from 'lodash.clonedeep';
import { enumerable } from '../utils';
import { SlicerOperationLifeCycle, ExecutionConfig } from '../interfaces';
import { OperationLoader } from '../operation-loader';
import SlicerCore from '../operations/core/slicer-core';
import { registerApis } from '../register-apis';
import {
    EventHandlers,
    SlicerContext,
    SlicerOperations,
    ExecutionContextConfig
} from './interfaces';

const _loaders = new WeakMap<SlicerExecutionContext, OperationLoader>();
const _operations = new WeakMap<SlicerExecutionContext, SlicerOperations>();

export class SlicerExecutionContext {
    readonly config: ExecutionConfig;
    readonly context: SlicerContext;
    readonly assetIds: string[] = [];
    readonly slicer: SlicerCore;
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

        _loaders.set(this, loader);

        _operations.set(this, new Set());

        const readerConfig = this.config.operations[0];
        const mod = loader.loadReader(readerConfig._op, this.assetIds);

        const op = new mod.Slicer(this.context, readerConfig, this.config);
        this.slicer = op;
        this.addOperation(op);
    }

    @enumerable(false)
    async initialize() {
        const promises = [];
        for (const op of this.getOperations()) {
            promises.push(op.initialize());
        }

        await Promise.all(promises);
    }

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

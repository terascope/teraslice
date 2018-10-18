import { EventEmitter } from 'events';
import cloneDeep from 'lodash.clonedeep';
import { locked } from './utils';
import * as i from './interfaces';
import { OperationLoader } from './operation-loader';
import FetcherCore from './operations/core/fetcher-core';
import ProcessorCore from './operations/core/processor-core';
import { ExecutionContextAPI } from './execution-context-apis';
import { OperationAPIConstructor } from './operations/operation-api';
import { registerApis, JobRunnerAPI, OpRunnerAPI } from './register-apis';

const _loaders = new WeakMap<WorkerExecutionContext, OperationLoader>();
const _lifecycle = new WeakMap<WorkerExecutionContext, InitializedOperations>();

export class WorkerExecutionContext {
    readonly config: i.ExecutionConfig;
    readonly context: WorkerContext;
    readonly assetIds: string[] = [];
    readonly fetcher: FetcherCore;
    readonly processors: Set<ProcessorCore>;
    private events: EventEmitter;
    private _handlers: EventHandlers = {};

    constructor(config: ExecutionContextConfig) {
        this.events = config.context.apis.foundation.getSystemEvents();

        this._handlers['execution:add-to-lifecycle'] = (op: i.WorkerOperationLifeCycle) => {
            this.lifecycle.add(op);
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

        _loaders.set(this, loader);

        _lifecycle.set(this, new Set());

        const readerConfig = this.config.operations[0];
        const mod = loader.loadReader(readerConfig._op, this.assetIds);
        this.registerAPI(readerConfig._op, mod.API);

        const op = new mod.Fetcher(this.context, readerConfig, this.config);
        this.fetcher = op;
        this.lifecycle.add(op);

        this.processors = new Set();

        for (const opConfig of this.config.operations.slice(1)) {
            const name = opConfig._op;
            const mod = loader.loadProcessor(name, this.assetIds);
            this.registerAPI(name, mod.API);

            const op = new mod.Processor(this.context, opConfig, this.config);
            this.lifecycle.add(op);
            this.processors.add(op);
        }
    }

    @locked()
    async initialize() {
        const promises = [];
        for (const op of this.lifecycle.values()) {
            promises.push(op.initialize());
        }

        await Promise.all(promises);
    }
    @locked()
    async shutdown() {
        const promises = [];
        for (const op of this.lifecycle.values()) {
            promises.push(op.shutdown());
        }
        await Promise.all(promises);
    }

    private get lifecycle() {
        return _lifecycle.get(this) as InitializedOperations;
    }

    @locked()
    private registerAPI(name: string, API?: OperationAPIConstructor) {
        if (API == null) return;

        this.context.apis.executionContext.addToRegistry(name, API);
    }
}

interface ExecutionContextConfig {
    context: i.Context;
    executionConfig: i.ExecutionConfig;
    terasliceOpPath: string;
    assetIds?: string[];
}

interface InitializedOperations extends Set<i.WorkerOperationLifeCycle> {}

interface WorkerContextApis extends i.ContextApis {
    op_runner: OpRunnerAPI;
    executionContext: ExecutionContextAPI;
    job_runner: JobRunnerAPI;
}

export interface WorkerContext extends i.Context {
    apis: WorkerContextApis;
}

interface EventHandlers {
    [eventName: string]: (...args: any[]) => void;
}

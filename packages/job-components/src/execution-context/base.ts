import { EventEmitter } from 'events';
import { isFunction, cloneDeep } from '@terascope/utils';
import { OperationLoader } from '../operation-loader';
import { registerApis } from '../register-apis';
import { ExecutionConfig, WorkerContext, OperationLifeCycle } from '../interfaces';
import { EventHandlers, ExecutionContextConfig } from './interfaces';

/**
 * A base class for an Execution Context
 */
export default class BaseExecutionContext<T extends OperationLifeCycle> {
    readonly config: ExecutionConfig;
    readonly context: WorkerContext;

    readonly assetIds: string[] = [];

    readonly exId: string;
    readonly jobId: string;

    /** The terafoundation EventEmitter */
    readonly events: EventEmitter;

    protected readonly _loader: OperationLoader;
    protected readonly _operations = new Set() as Set<T>;
    protected _methodRegistry = new Map<keyof T, Set<number>>();

    private readonly _handlers: EventHandlers = {};

    constructor(config: ExecutionContextConfig) {
        this.events = config.context.apis.foundation.getSystemEvents();

        this._handlers['execution:add-to-lifecycle'] = (op: T) => {
            this.addOperation(op);
        };

        this.events.on('execution:add-to-lifecycle', this._handlers['execution:add-to-lifecycle']);

        const executionConfig = cloneDeep(config.executionConfig);
        this._loader = new OperationLoader({
            terasliceOpPath: config.terasliceOpPath,
            assetPath: config.context.sysconfig.teraslice.assets_directory,
        });

        registerApis(config.context, executionConfig, config.assetIds);
        this.context = config.context as WorkerContext;

        this.assetIds = config.assetIds || [];

        this.config = executionConfig;
        this.exId = executionConfig.ex_id;
        this.jobId = executionConfig.job_id;
    }

    /**
     * Called to initialize all of the registered operations
     */
    async initialize(initConfig?: any) {
        const promises = [];
        for (const op of this.getOperations()) {
            promises.push(op.initialize(initConfig));
        }

        await Promise.all(promises);
    }

    /**
     * Called to cleanup all of the registered operations
     */
    async shutdown() {
        const promises = [];
        for (const op of this.getOperations()) {
            promises.push(op.shutdown());
        }

        await Promise.all(promises);

        Object.keys(this._handlers).forEach(event => {
            const listener = this._handlers[event];
            this.events.removeListener(event, listener);
        });
    }

    get api() {
        return this.context.apis.executionContext;
    }

    /**
     * Returns a list of any registered Operation that has been
     * initialized.
     */
    getOperations() {
        return this._operations.values();
    }

    /** Add an operation to the lifecycle queue */
    protected addOperation(op: T) {
        this._operations.add(op);

        this._resetMethodRegistry();
    }

    /** Run an async method on the operation lifecycle */
    protected _runMethodAsync(method: keyof T, ...args: any[]) {
        const set = this._getMethodSet(method);
        if (set.size === 0) return;

        let i = 0;
        const promises = [];
        for (const operation of this.getOperations()) {
            const index = i++;
            if (set.has(index)) {
                // @ts-ignore because I can't get the typedefinitions to work right
                promises.push(operation[method](...args));
            }
        }

        return Promise.all(promises);
    }

    /** Run an method */
    protected _runMethod(method: keyof T, ...args: any[]) {
        const set = this._getMethodSet(method);
        if (set.size === 0) return;

        let index = 0;
        for (const operation of this.getOperations()) {
            if (set.has(index)) {
                // @ts-ignore because I can't get the typedefinitions to work right
                operation[method](...args);
            }
            index++;
        }
    }

    protected _resetMethodRegistry() {
        for (const set of this._methodRegistry.values()) {
            set.clear();
        }

        let index = 0;
        for (const op of this.getOperations()) {
            for (const [method, set] of this._methodRegistry.entries()) {
                if (isFunction(op[method])) {
                    set.add(index);
                }
            }

            index++;
        }
    }

    private _getMethodSet(method: keyof T): Set<number> {
        return this._methodRegistry.get(method) || new Set();
    }
}

import { EventEmitter } from 'node:events';
import {
    isFunction, cloneDeep, pMap,
    Logger, toHumanTime
} from '@terascope/core-utils';
import { OperationLoader } from '../operation-loader/index.js';
import { registerApis } from '../register-apis.js';
import { ExecutionConfig, Context, OperationLifeCycle } from '../interfaces/index.js';
import { EventHandlers, ExecutionContextConfig } from './interfaces.js';
import { ExecutionContextAPI } from './api.js';
import { isPromAvailable } from '../utils.js';

/**
 * A base class for an Execution Context
 */
export default class BaseExecutionContext<T extends OperationLifeCycle> {
    readonly config: ExecutionConfig;
    readonly context: Context;

    readonly assetIds: string[] = [];

    readonly exId: string;
    readonly jobId: string;

    /** The terafoundation EventEmitter */
    readonly events: EventEmitter;

    readonly logger: Logger;

    protected readonly _loader: OperationLoader;
    protected readonly _operations = new Set() as Set<T>;
    protected _methodRegistry = new Map<keyof T, Set<number>>();

    private readonly _handlers: EventHandlers = {};

    constructor(config: ExecutionContextConfig, loggerName: string) {
        this.events = config.context.apis.foundation.getSystemEvents();

        this._handlers['execution:add-to-lifecycle'] = (op: T) => {
            this.addOperation(op);
        };

        this.events.on('execution:add-to-lifecycle', this._handlers['execution:add-to-lifecycle']);

        const executionConfig = cloneDeep(config.executionConfig);

        this._loader = new OperationLoader({
            assetPath: config.context.sysconfig.teraslice.assets_directory,
        });

        registerApis(config.context, executionConfig, config.assetIds);
        this.context = config.context as Context;

        this.assetIds = config.assetIds || [];

        this.config = executionConfig;
        this.exId = executionConfig.ex_id;
        this.jobId = executionConfig.job_id;

        this.logger = this.api.makeLogger(loggerName, { level: executionConfig.log_level });
    }

    /**
     * Called to initialize all of the registered operations
     */
    async initialize(initConfig?: unknown): Promise<void> {
        // make sure we autoload the apis before we initialize the processors
        await pMap((this.config.apis || []), async ({ _name: name }) => {
            const api = this.api.apis[name];
            if (api.type !== 'api') return;

            const startTime = Date.now();

            this.logger.info(`[START] "${name}" api instance initialize`);
            try {
                await this.api.initAPI(name);
            } finally {
                const diff = toHumanTime(Date.now() - startTime);
                this.logger.info(`[FINISH] "${name}" api instance initialize, took ${diff}`);
            }
        });

        await pMap(this._operations, async (op) => {
            if (!('initialize' in op)) return;

            const startTime = Date.now();
            // @ts-expect-error
            const name = op.opConfig?._op ?? op.apiConfig?._name ?? op.constructor.name;

            this.logger.info(`[START] "${name}" operation initialize`);
            try {
                await op.initialize(initConfig);
            } finally {
                const diff = toHumanTime(Date.now() - startTime);
                this.logger.info(`[FINISH] "${name}" operation initialize, took ${diff}`);
            }
        });
    }

    /**
     * Called to cleanup all of the registered operations
     */
    async shutdown(): Promise<void> {
        await pMap(this._operations, async (op) => {
            if (!('shutdown' in op)) return;

            const startTime = Date.now();
            // @ts-expect-error
            const name = op.opConfig?._op ?? op.apiConfig?._name ?? op.constructor.name;

            this.logger.info(`[START] "${name}" operation shutdown`);
            try {
                await op.shutdown();
            } finally {
                const diff = toHumanTime(Date.now() - startTime);
                this.logger.info(`[FINISH] "${name}" operation shutdown, took ${diff}`);
            }
        }).finally(() => {
            Object.entries(this._handlers)
                .forEach(([event, listener]) => {
                    this.events.removeListener(event, listener);
                });
        });

        if (isPromAvailable(this.context)) {
            await this.context.apis.foundation.promMetrics.shutdown();
        }
    }

    get api(): ExecutionContextAPI {
        return this.context.apis.executionContext;
    }

    /**
     * Returns a list of any registered Operation that has been
     * initialized.
     */
    getOperations(): T[] {
        return [...this._operations.values()];
    }

    /** Add an operation to the lifecycle queue */
    protected addOperation(op: T): void {
        this._operations.add(op);

        this._resetMethodRegistry();
    }

    /** Run an async method on the operation lifecycle */
    protected _runMethodAsync(method: keyof T, ...args: any[]): Promise<any[]> {
        const set = this._getMethodSet(method);
        if (set.size === 0) return Promise.resolve([]);

        let i = 0;
        const promises = [];
        for (const operation of this._operations) {
            const index = i++;
            if (set.has(index)) {
                // @ts-expect-error because I can't get the type definitions to work right
                promises.push(operation[method](...args));
            }
        }

        return Promise.all(promises);
    }

    /** Run an method */
    protected _runMethod(method: keyof T, ...args: any[]): void {
        const set = this._getMethodSet(method);
        if (set.size === 0) return;

        let index = 0;
        for (const operation of this._operations) {
            if (set.has(index)) {
                // @ts-expect-error because I can't get the type definitions to work right
                operation[method](...args);
            }
            index++;
        }
    }

    protected _resetMethodRegistry(): void {
        for (const set of this._methodRegistry.values()) {
            set.clear();
        }

        let index = 0;
        for (const op of this._operations) {
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

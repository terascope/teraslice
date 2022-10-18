import { EventEmitter } from 'events';
import {
    get, set, AnyObject, Logger,
    isTest, isString
} from '@terascope/utils';
import {
    OpAPI, Context, ExecutionConfig,
    APIConfig, WorkerContext
} from '../interfaces/index.js';
import { isOperationAPI, getOperationAPIType } from './utils.js';
import { Observer, APIConstructor } from '../operations/index.js';
import { JobAPIInstances } from './interfaces.js';
import { makeExContextLogger } from '../utils.js';

interface MetadataFns {
    update: (exId: string, metadata: AnyObject) => Promise<void>;
    get: (exId: string) => Promise<AnyObject>;
}

const _metadataFns = new WeakMap<WorkerContext, MetadataFns>();

/**
 * A utility API exposed on the Terafoundation Context APIs.
 * The following functionality is included:
 *  - Registering Operation API
 *  - Creating an API (usually done from an Operation),
 *    it also includes attaching the API to the Execution LifeCycle.
 *    An API will only be created once.
 *  - Getting a reference to an API
 */
export class ExecutionContextAPI {
    private readonly _apis: JobAPIInstances = {};
    private readonly _context: WorkerContext;
    private readonly _events: EventEmitter;
    private readonly _executionConfig: ExecutionConfig;
    private readonly _logger: Logger;

    constructor(context: Context, executionConfig: ExecutionConfig) {
        this._context = context as WorkerContext;
        this._events = context.apis.foundation.getSystemEvents();
        this._executionConfig = executionConfig;
        this._logger = this.makeLogger('execution_context_api');
    }

    /** For backwards compatibility */
    get registry(): Record<string, any> {
        return {};
    }

    get apis(): Readonly<JobAPIInstances> {
        return this._apis;
    }

    registerMetadataFns(fns: MetadataFns): void {
        if (_metadataFns.has(this._context)) {
            throw new Error('Metadata functions can only be registered once');
        }

        _metadataFns.set(this._context, fns);
    }

    /** Add an API constructor to the registry */
    addToRegistry(name: string, API: APIConstructor): void {
        if (this._apis[name] != null) {
            throw new Error(`Cannot register API "${name}" due to conflict`);
        }

        const { apis = [] } = this._executionConfig;

        const apiConfig = apis.find((a: APIConfig) => a._name === name) || {
            _name: name,
        };

        const instance = new API(this._context, apiConfig, this._executionConfig);
        const type = getOperationAPIType(instance);
        this._apis[name] = {
            instance,
            type,
        };

        const eventName = 'execution:add-to-lifecycle';
        const count = this._events.listenerCount(eventName);
        if (!count) {
            if (isTest) return;
            this._logger.warn(`no listener ${eventName} available but is needed to register the api`);
        } else {
            this._events.emit(eventName, instance);
            this._logger.trace(`registered api ${name}`);
        }
    }

    /**
     * Get a reference to a specific operation API,
     * the must be initialized and created
     */
    getObserver<T extends Observer = Observer>(name: string): T {
        const api = this._apis[name];
        if (api == null) {
            throw new Error(`Unable to find API by name "${name}"`);
        }
        if (api.type !== 'observer') {
            throw new Error(`Unable to find observer by name "${name}"`);
        }
        return api.instance as T;
    }

    /**
     * Get a reference to a specific operation API,
     * the must be initialized and created
     */
    getAPI<T extends OpAPI = OpAPI>(name: string): T {
        const api = this._apis[name];
        if (api == null) {
            throw new Error(`Unable to find API by name "${name}"`);
        }
        if (api.opAPI == null) {
            throw new Error(`Unable to find created API by name "${name}"`);
        }
        return api.opAPI as T;
    }

    /**
     * Create an instance of the API
     *
     * @param name the name of API to create
     * @param params any additional options that the API may need
     */
    async initAPI<T extends OpAPI = OpAPI>(name: string, ...params: any[]): Promise<T> {
        const api = this._apis[name];
        if (api == null) {
            throw new Error(`Unable to find API by name "${name}"`);
        }

        if (!isOperationAPI(api.instance)) {
            throw new Error('Observers cannot be created');
        }

        if (api.opAPI != null) {
            const msg = `using existing instance of api: "${name}"`;
            if (params.length) {
                this._logger.warn(`${msg}, ignoring params`);
            } else {
                this._logger.debug(`${msg}`);
            }
            return api.opAPI as T;
        }

        api.opAPI = await api.instance.createAPI(...params);
        this._logger.trace(`initialized api ${name}`);
        return api.opAPI as T;
    }

    /**
     * Make a logger with a the job_id and ex_id in the logger context
     */
    makeLogger(moduleName: string, extra: AnyObject = {}): Logger {
        return makeExContextLogger(this._context, this._executionConfig, moduleName, extra);
    }

    /**
     * Update metadata on the execution context
     * Only update the metadata after the execution has been initialized
    */
    async setMetadata(key: string, value: unknown): Promise<void> {
        if (!key || !isString(key)) {
            throw new Error('Unable to set execution metadata, missing key');
        }
        const exId = this._executionConfig.ex_id;
        const metadata: AnyObject = await this._getMetadata(exId);

        set(metadata, key, value);
        this._logger.warn('updating execution metadata', metadata);
        await this._updateMetadata(exId, metadata);
    }

    async getMetadata(key?: string): Promise<AnyObject> {
        const exId = this._executionConfig.ex_id;
        const metadata = await this._getMetadata(exId);

        if (key) return get(metadata, key);
        this._logger.warn('updating execution metadata', metadata);
        return metadata;
    }

    // These methods will be replaced to actually update the
    // execution metadata when running in production
    private async _updateMetadata(exId: string, metadata: AnyObject): Promise<void> {
        const api = _metadataFns.get(this._context);
        if (api && api.update) {
            return api.update(exId, metadata);
        }

        this._executionConfig.metadata = metadata;
    }

    // These methods will be replaced to actually get the
    // execution metadata when running in production
    private async _getMetadata(exId: string): Promise<AnyObject> {
        const api = _metadataFns.get(this._context);
        if (api && api.get) {
            return api.get(exId);
        }

        return this._executionConfig.metadata || {};
    }
}

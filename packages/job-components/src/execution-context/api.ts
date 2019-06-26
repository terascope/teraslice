import { EventEmitter } from 'events';
import { AnyObject, Logger, isTest } from '@terascope/utils';
import { OpAPI, Context, ExecutionConfig, APIConfig, WorkerContext } from '../interfaces';
import { isOperationAPI, getOperationAPIType, makeContextLogger } from './utils';
import { Observer, APIConstructor } from '../operations';
import { JobAPIInstances } from './interfaces';

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
    get registry() {
        return {};
    }

    get apis(): Readonly<JobAPIInstances> {
        return this._apis;
    }

    /** Add an API constructor to the registry */
    addToRegistry(name: string, API: APIConstructor) {
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
    async initAPI(name: string, ...params: any[]): Promise<OpAPI> {
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
            return api.opAPI;
        }

        api.opAPI = await api.instance.createAPI(...params);
        this._logger.trace(`initialized api ${name}`);
        return api.opAPI;
    }

    /**
     * Make a logger with a the job_id and ex_id in the logger context
     */
    makeLogger(moduleName: string, extra: AnyObject = {}) {
        const { ex_id, job_id } = this._executionConfig;
        return makeContextLogger(this._context, moduleName, { ex_id, job_id, ...extra });
    }
}

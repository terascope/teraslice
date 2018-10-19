import { OpAPI, Context, ExecutionConfig } from '../interfaces';
import { OperationAPIConstructor } from '../operations';
import legacySliceEventsShim from '../operations/shims/legacy-slice-events-shim';

// WeakMaps are used as a memory efficient reference to private data
const _registry = new WeakMap();
const _apis = new WeakMap();
const _config = new WeakMap();

/**
 * A utility API exposed on the Terafoundation Context APIs.
 * The following functionality is included:
 *  - Registering Operation API
 *  - Creating an API (usually done from an Operation),
 *    it also includes attaching the API to the Execution LifeCycle.
 *    An API can only be created once.
 *  - Getting a reference to an API
*/
export class ExecutionContextAPI {
    constructor(context: Context, executionConfig: ExecutionConfig) {
        _config.set(this, {
            context,
            executionConfig,
            events: context.apis.foundation.getSystemEvents(),
        });

        _registry.set(this, {});
        _apis.set(this, {});
    }

    /** Add an API constructor to the registry */
    addToRegistry(name: string, api: OperationAPIConstructor) {
        const registry = this.registry;
        registry[name] = api;
        _registry.set(this, registry);
    }

    /** Get all of the registered API constructors */
    get registry(): APIRegistry {
        return _registry.get(this);
    }

    /** Get all of the initalized APIs */
    get apis(): APIS {
        return _apis.get(this);
    }

    /**
     * Get a reference to a specific API,
     * the must be initialized.
     */
    getAPI(name: string) {
        if (this.apis[name] == null) {
            throw new Error(`Unable to find API by name "${name}"`);
        }
        return this.apis[name];
    }

    /**
     * Initalize an API and attach it
     * to the lifecycle of an Execution.
     */
    async initAPI(name: string, ...params: any[]) {
        const config = _config.get(this);
        if (this.registry[name] == null) {
            throw new Error(`Unable to find API by name "${name}"`);
        }

        if (this.apis[name] != null) {
            throw new Error(`API "${name}" can only be initalized once`);
        }

        const API = this.registry[name];

        const api = new API(config.context, config.executionConfig);
        await api.initialize();

        config.events.emit('execution:add-to-lifecycle', api);

        legacySliceEventsShim(api);

        this.apis[name] = await api.createAPI(...params);
        return this.apis[name];
    }
}

interface APIS {
    [name: string]: OpAPI;
}

interface APIRegistry {
    [name: string]: OperationAPIConstructor;
}

import { APIFactoryRegistry } from '../interfaces/index.js';
import OperationAPI from './operation-api.js';

export default abstract class APIFactory<T, C> extends OperationAPI {
    protected readonly _registry: Map<string, T> = new Map();
    protected readonly _configRegistry: Map<string, C> = new Map();

    abstract create(name: string, config: Partial<C>): Promise<{
        client: T;
        config: C;
    }>;

    abstract remove(name: string): Promise<void>;

    async createAPI(): Promise<APIFactoryRegistry<T, C>> {
        const registry = this._registry;
        const configRegistry = this._configRegistry;

        return {
            get size() {
                return registry.size;
            },
            get: (name: string) => registry.get(name),
            getConfig: (name: string) => configRegistry.get(name),
            create: async (name: string, clientConfig: Partial<C>) => {
                if (registry.has(name)) {
                    throw new Error(`API for "${name}" already exists`);
                }

                const { client, config } = await this.create(name, clientConfig);
                registry.set(name, client);
                configRegistry.set(name, config);

                return client;
            },
            remove: async (name: string) => {
                await this.remove(name);
                registry.delete(name);
                configRegistry.delete(name);
            },
            entries: registry.entries.bind(registry),
            keys: registry.keys.bind(registry),
            values: registry.values.bind(registry),
        };
    }
}

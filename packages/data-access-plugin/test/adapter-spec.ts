import 'jest-extended';
import { debugLogger } from '@terascope/utils';
import { makeClient } from './helpers/elasticsearch';
import ManagerPlugin from '../src/manager';
import SearchPlugin from '../src/search';
import { PluginConfig } from '../src/interfaces';
import index from '../src';

describe('TeraserverAdapterPlugin', () => {
    const client = makeClient();

    it('should export a valid plugin adapter', () => {
        expect(index._manager).toBeNil();
        expect(index._initialized).toBeFalse();
        expect(index.config).toBeFunction();
        expect(index.init).toBeFunction();
        expect(index.post).toBeFunction();
        expect(index.routes).toBeFunction();
    });

    it('should not be able to call init if not configured', () => {
        return expect(index.init()).rejects.toThrowError('Plugin has not been configured');
    });

    it('should not be able to call routes if not configured', () => {
        expect(() => {
            index.routes();
        }).toThrowError('Plugin has not been configured');
    });

    it('should be able to call config', async () => {
        const pluginConfig: PluginConfig = {
            elasticsearch: client,
            url_base: '',
            // @ts-ignore
            app: {},
            logger: debugLogger('manager-plugin'),
            server_config: {
                data_access: {
                    namespace: 'test_da_adapter',
                    bootstrap_mode: true,
                },
                teraserver: {
                    shutdown_timeout: 1,
                    plugins: [],
                },
                terafoundation: {},
            }
        };

        expect(index._initialized).toBeFalse();
        expect(() => index.config(pluginConfig)).not.toThrow();
        expect(index._initialized).toBeFalse();

        expect(index._manager).toBeInstanceOf(ManagerPlugin);
        expect(index._search).toBeInstanceOf(SearchPlugin);

        // @ts-ignore
        index._manager = {
            async initialize() {},
            async shutdown() {},
            registerRoutes() {}
        };

        // @ts-ignore
        index._search = {
            async initialize() {},
            async shutdown() {},
            registerRoutes() {}
        };
    });

    it('should not be able to call routes if not initialized', () => {
        expect(() => {
            index.routes();
        }).toThrowError('Plugin has not been initialized');
    });

    it('should not be able to call post if not initialized', () => {
        expect(() => {
            index.post();
        }).toThrowError('Plugin has not been initialized');
    });

    it('should be able to call init', async () => {
        await expect(index.init()).resolves.toBeNil();
        expect(index._initialized).toBeTrue();
    });

    it('should be able to call routes', () => {
        expect(() => {
            index.routes();
        }).not.toThrow();
    });

    it('should be able to call post', () => {
        expect(() => {
            index.post();
        }).not.toThrow();
    });
});

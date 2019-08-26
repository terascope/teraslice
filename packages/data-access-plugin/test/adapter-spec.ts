import 'jest-extended';
import { TestContext } from '@terascope/job-components';
import { makeClient } from './helpers/elasticsearch';
import { TEST_INDEX_PREFIX } from './helpers/config';
import QueryPointPlugin from '../src/query-point';
import { PluginConfig } from '../src/interfaces';
import ManagerPlugin from '../src/manager';
import SearchPlugin from '../src/search';
import index from '../src';

describe('TeraserverAdapterPlugin', () => {
    const client = makeClient();
    const context = new TestContext('adapter-plugin', {
        clients: [
            {
                type: 'elasticsearch',
                create: () => ({ client }),
                endpoint: 'default',
            },
        ],
    });

    it('should export a valid plugin adapter', () => {
        expect(index._manager).toBeNil();
        expect(index._initialized).toBeFalse();
        expect(index.config).toBeFunction();
        expect(index.init).toBeFunction();
        expect(index.post).toBeFunction();
        expect(index.routes).toBeFunction();
        expect(index.config_schema).toBeFunction();
    });

    it('should have a config', () => {
        expect(index.config_schema()).toBeObject();
    });

    it('should not be able to call init if not configured', () => expect(index.init()).rejects.toThrowError('Plugin has not been configured'));

    it('should not be able to call routes if not configured', () => {
        expect(() => {
            index.routes([]);
        }).toThrowError('Plugin has not been configured');
    });

    it('should be able to call config', async () => {
        const pluginConfig: PluginConfig = {
            elasticsearch: client,
            url_base: '',
            // @ts-ignore
            app: { all() {} },
            context,
            logger: context.logger,
            server_config: {
                data_access: {
                    namespace: `${TEST_INDEX_PREFIX}da_adapter`,
                },
                teraserver: {
                    shutdown_timeout: 1,
                    plugins: [],
                },
                terafoundation: {},
            },
        };

        expect(index._initialized).toBeFalse();
        expect(() => index.config(pluginConfig)).not.toThrow();
        expect(index._initialized).toBeFalse();

        expect(index._manager).toBeInstanceOf(ManagerPlugin);
        expect(index._queryPoint).toBeInstanceOf(QueryPointPlugin);
        expect(index._search).toBeInstanceOf(SearchPlugin);

        // @ts-ignore
        index._manager = {
            async initialize() {},
            async shutdown() {},
            registerRoutes() {},
        };

        // @ts-ignore
        index._queryPoint = {
            async initialize() {},
            async shutdown() {},
            registerRoutes() {},
        };

        // @ts-ignore
        index._search = {
            async initialize() {},
            async shutdown() {},
            registerRoutes() {},
            registerMiddleware() {},
        };
    });

    it('should not be able to call routes if not initialized', () => {
        expect(() => {
            index.routes([]);
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
            index.routes([]);
        }).not.toThrow();
    });

    it('should be able to call post', () => {
        expect(() => {
            index.post();
        }).not.toThrow();
    });
});

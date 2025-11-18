import { EventEmitter } from 'node:events';
import { debugLogger } from '@terascope/core-utils';
import { TestContext } from '../src/index.js';

const logger = debugLogger('TestContext');

describe('TestContext', () => {
    it('should have a TestContext', async () => {
        expect(TestContext).toBeTruthy();
        type HelloAPIs = {
            hello: {
                there(): string;
            };
        };

        type HelloSysConfig = {
            hello: {
                name: string;
            };
        };

        const context = await TestContext.createContext<HelloSysConfig, HelloAPIs>({
            name: 'test-name',
            sysconfig: {
                hello: {
                    name: 'superman'
                }
            }
        });

        expect(context).toHaveProperty('sysconfig');
        expect(context.sysconfig).toHaveProperty('_nodeName');
        expect(context.sysconfig).toHaveProperty('hello.name', 'superman');
        expect(context).toHaveProperty('cluster');
        expect(context).toHaveProperty('apis');

        expect(context.apis.foundation.getSystemEvents()).toBeInstanceOf(EventEmitter);
        expect(context.apis.foundation.makeLogger()).toBeTruthy();
        expect(context.apis.foundation.makeLogger({ module: 'hi' })).toBeTruthy();

        const api = { there: () => 'peter' };
        expect(context.apis.registerAPI('hello', api)).toBeUndefined();
        expect(context.apis.hello.there()).toEqual('peter');
    });

    it('should be able to get and set async clients', async () => {
        const context = await TestContext.createContext({
            name: 'test-clients',
            clients: [
                {
                    async createClient() {
                        return { client: 'hello', logger };
                    },
                    type: 'test'
                }
            ]
        });

        expect(context.apis.getTestClients()).toEqual({});

        const results = await context.apis.foundation.createClient({
            type: 'test',
            endpoint: 'default'
        });

        expect(results).toEqual({ client: 'hello', logger });
    });

    it('should be able to init prom_metrics_api', async () => {
        const context = await TestContext.createContext();
        context.sysconfig.teraslice = { cluster_manager_type: 'kubernetesV2', name: 'ts-test' };
        context.sysconfig.terafoundation.prom_metrics_enabled = true;
        const config = {
            terasliceName: context.sysconfig.teraslice.name,
            tf_prom_metrics_enabled: true,
            tf_prom_metrics_port: 3333,
            tf_prom_metrics_add_default: false,
            logger: context.logger,
            assignment: 'master',
            prom_metrics_display_url: context.sysconfig.terafoundation.prom_metrics_display_url
        };
        expect(await context.apis.foundation.promMetrics.init(config)).toBe(true);
    });
});

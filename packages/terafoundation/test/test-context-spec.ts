import { EventEmitter } from 'node:events';
import { debugLogger } from '@terascope/utils';
import { TestContext } from '../src';

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
        }

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
});

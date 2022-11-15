import { EventEmitter } from 'events';
import { TestContext } from '../src/index.js';

describe('TestContext', () => {
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

    it('should have a TestContext', async () => {
        expect(TestContext).toBeTruthy();

        const context = new TestContext<HelloSysConfig, HelloAPIs>({
            name: 'test-name',
            sysconfig: {
                hello: {
                    name: 'superman'
                }
            }
        });

        await context.init();

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
        const context = new TestContext({
            name: 'test-clients',
            clients: [
                {
                    async createClient() {
                        return { client: 'hello' };
                    },
                    type: 'test'
                }
            ]
        });

        await context.init();

        expect(context.apis.getTestClients()).toEqual({});

        const results = await context.apis.foundation.createClient({
            type: 'test',
            endpoint: 'default'
        });
        expect(results).toEqual({ client: 'hello' });
    });

    it('should be able to get and set clients', async () => {
        const context = new TestContext({
            name: 'test-clients',
            clients: [
                {
                    async createClient() {
                        return { client: 'hello' };
                    },
                    type: 'test'
                }
            ]
        });

        await context.init();

        expect(context.apis.getTestClients()).toEqual({});

        const firstClient = await context.apis.foundation.createClient({
            type: 'test',
            endpoint: 'default'
        });
        expect(firstClient).toEqual({ client: 'hello' });

        expect(context.apis.getTestClients()).toEqual({
            test: {
                default: {
                    client: 'hello'
                }
            }
        });

        context.apis.setTestClients([
            {
                async createClient() {
                    return { client: 'howdy' };
                },
                type: 'test'
            }
        ]);

        expect(context.apis.getTestClients()).toEqual({});

        const secondClient = await context.apis.foundation.createClient({
            type: 'test',
            endpoint: 'default'
        });

        expect(secondClient).toEqual({ client: 'howdy' });

        expect(context.apis.getTestClients()).toEqual({
            test: {
                default: {
                    client: 'howdy'
                }
            }
        });
    });

    it('should throw if no client is given', async () => {
        const context = new TestContext<HelloSysConfig, HelloAPIs>({
            name: 'test-name',
            sysconfig: {
                hello: {
                    name: 'superman'
                }
            }
        });

        await context.init();

        await expect(() => {
            return context.apis.foundation.createClient({
                endpoint: 'default',
                type: 'example',
            });
        }).rejects.toThrowError('No client was found for connection "example:default"');
    })
});

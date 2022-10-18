import { EventEmitter } from 'events';
import { TestContext } from '../src/index.js';

describe('TestContext', () => {
    it('should have a TestContext', () => {
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

        const context = new TestContext<HelloSysConfig, HelloAPIs>({
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
        expect(context).toHaveProperty('foundation');
        expect(context.apis.foundation.getSystemEvents()).toBeInstanceOf(EventEmitter);
        expect(() => {
            context.apis.foundation.getConnection({
                endpoint: 'default',
                type: 'example',
            });
        }).toThrowError('No client was found for connection "example:default"');
        expect(context.apis.foundation.makeLogger()).toBeTruthy();
        expect(context.apis.foundation.makeLogger({ module: 'hi' })).toBeTruthy();

        const api = { there: () => 'peter' };
        expect(context.apis.registerAPI('hello', api)).toBeUndefined();
        expect(context.apis.hello.there()).toEqual('peter');
    });

    it('should be able to get and set clients', () => {
        const context = new TestContext({
            name: 'test-clients',
            clients: [
                {
                    create() {
                        return { client: 'hello' };
                    },
                    type: 'test'
                }
            ]
        });

        expect(context.apis.getTestClients()).toEqual({});

        expect(context.apis.foundation.getConnection({
            type: 'test',
            endpoint: 'default'
        })).toEqual({ client: 'hello' });

        expect(context.apis.getTestClients()).toEqual({
            test: {
                default: {
                    client: 'hello'
                }
            }
        });

        context.apis.setTestClients([
            {
                create() {
                    return { client: 'howdy' };
                },
                type: 'test'
            }
        ]);

        expect(context.apis.getTestClients()).toEqual({});

        expect(context.apis.foundation.getConnection({
            type: 'test',
            endpoint: 'default'
        })).toEqual({ client: 'howdy' });

        expect(context.apis.getTestClients()).toEqual({
            test: {
                default: {
                    client: 'howdy'
                }
            }
        });
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

        expect(context.apis.getTestClients()).toEqual({});

        const results = await context.apis.foundation.createClient({
            type: 'test',
            endpoint: 'default'
        });
        expect(results).toEqual({ client: 'hello' });
    });
});
